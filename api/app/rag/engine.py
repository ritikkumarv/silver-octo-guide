"""
RAG Engine - Retrieval Augmented Generation using LangChain + ChromaDB + OpenAI
Indexes all Montgomery datasets and provides AI-powered Q&A.
"""
import os
from collections import deque
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_openai import ChatOpenAI
from langchain_nvidia_ai_endpoints import NVIDIAEmbeddings
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage
from app.core.config import settings
from app.data.loader import prepare_documents_for_rag

# Singleton instances
_vectorstore = None
_llm = None
_chat_history: deque = deque(maxlen=20)   # last 10 exchanges (20 messages)


SYSTEM_PROMPT = """You are MontgomeryAI, an intelligent and friendly AI assistant for the City of Montgomery, Alabama.
You help residents, visitors, and city officials by answering questions using real city data.

You have access to data across these categories:
- City Services (311, water, waste, permits, animal control, code enforcement)
- General Information (demographics, economy, education, climate)
- Planning & Development (downtown revitalization, business licenses, zoning, affordable housing)
- Public Health (hospitals, clinics, mental health, air quality)
- Public Safety (police, fire, crime stats, emergency management, cameras)
- Recreation & Culture (museums, parks, events, historical sites, zoo, theater)
- Transportation (buses, airport, roads, bike infrastructure, traffic)
- Historical Markers (Civil Rights sites, landmarks, museums)

Guidelines:
- Be helpful, accurate, and concise
- When providing locations, mention the address
- If data includes coordinates, mention you can show it on the map
- Cross-reference multiple datasets when relevant (e.g., safety + business for neighborhood recommendations)
- Acknowledge when you don't have real-time data but suggest where to find it
- Be enthusiastic about Montgomery's rich history and culture
- Provide actionable information when possible"""


def get_vectorstore():
    """Initialize or return the ChromaDB vector store with all Montgomery data."""
    global _vectorstore

    if _vectorstore is not None:
        return _vectorstore

    embeddings = NVIDIAEmbeddings(
        nvidia_api_key=settings.OPENAI_API_KEY,
        model=settings.OPENAI_EMBEDDING_MODEL,
    )

    # Check if persisted DB exists
    if os.path.exists(settings.CHROMA_PERSIST_DIR) and os.listdir(settings.CHROMA_PERSIST_DIR):
        _vectorstore = Chroma(
            persist_directory=settings.CHROMA_PERSIST_DIR,
            embedding_function=embeddings,
            collection_name="montgomery_data",
        )
        return _vectorstore

    # Build from scratch
    documents = prepare_documents_for_rag()

    texts = [doc["text"] for doc in documents]
    metadatas = [doc["metadata"] for doc in documents]
    ids = [doc["id"] for doc in documents]

    # Split longer documents
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=100,
    )

    split_texts = []
    split_metadatas = []
    split_ids = []

    for i, (text, meta, doc_id) in enumerate(zip(texts, metadatas, ids)):
        chunks = splitter.split_text(text)
        for j, chunk in enumerate(chunks):
            split_texts.append(chunk)
            split_metadatas.append(meta)
            split_ids.append(f"{doc_id}_chunk_{j}")

    _vectorstore = Chroma.from_texts(
        texts=split_texts,
        metadatas=split_metadatas,
        ids=split_ids,
        embedding=embeddings,
        collection_name="montgomery_data",
        persist_directory=settings.CHROMA_PERSIST_DIR,
    )

    return _vectorstore


def _get_llm():
    """Return a cached ChatOpenAI instance."""
    global _llm
    if _llm is None:
        _llm = ChatOpenAI(
            openai_api_key=settings.OPENAI_API_KEY,
            openai_api_base=settings.NVIDIA_BASE_URL,
            model_name=settings.OPENAI_MODEL,
            temperature=0.3,
        )
    return _llm


_prompt = ChatPromptTemplate.from_messages([
    ("system", SYSTEM_PROMPT),
    MessagesPlaceholder("chat_history"),
    ("human", "Context from Montgomery datasets:\n{context}\n\nQuestion: {question}"),
])


async def ask_montgomery(question: str) -> dict:
    """Process a user question through the RAG pipeline."""
    try:
        vectorstore = get_vectorstore()
        retriever = vectorstore.as_retriever(search_kwargs={"k": 6})
        docs = retriever.invoke(question)

        # Build context string from retrieved docs
        context = "\n\n".join(doc.page_content for doc in docs)

        # Invoke LLM with prompt + history
        llm = _get_llm()
        chain = _prompt | llm
        result = chain.invoke({
            "context": context,
            "chat_history": list(_chat_history),
            "question": question,
        })
        answer = result.content

        # Update chat history
        _chat_history.append(HumanMessage(content=question))
        _chat_history.append(AIMessage(content=answer))

        # Extract source categories & locations
        sources = set()
        locations = []
        for doc in docs:
            meta = doc.metadata
            if meta.get("category"):
                sources.add(meta["category"])
            if meta.get("lat") and meta.get("lon"):
                locations.append({
                    "name": meta.get("name", ""),
                    "lat": meta["lat"],
                    "lon": meta["lon"],
                    "category": meta.get("category", ""),
                })

        return {
            "answer": answer,
            "sources": list(sources),
            "map_highlights": locations,
        }
    except Exception as e:
        return {
            "answer": f"I apologize, but I encountered an error processing your question. Please make sure the OpenAI API key is configured. Error: {str(e)}",
            "sources": [],
            "map_highlights": [],
        }


def reset_chain():
    """Reset conversation memory."""
    _chat_history.clear()
