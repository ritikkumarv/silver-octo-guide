"""
Python 3.14+ compatibility patches.

ChromaDB uses pydantic v1's BaseSettings which breaks on Python 3.14
due to type inference changes. This module monkey-patches the
ModelField._set_default_and_type method to gracefully fall back to Any
when inference fails, allowing ChromaDB to initialize normally.

Import this module BEFORE importing chromadb.
"""
import sys

if sys.version_info >= (3, 14):
    try:
        import pydantic.v1.fields as _pv1f
        import pydantic.v1.errors as _pv1e

        _orig_set_default_and_type = _pv1f.ModelField._set_default_and_type

        def _patched_set_default_and_type(self: "_pv1f.ModelField") -> None:
            try:
                _orig_set_default_and_type(self)
            except _pv1e.ConfigError:
                from typing import Any
                self.outer_type_ = Any
                self.type_ = Any

        _pv1f.ModelField._set_default_and_type = _patched_set_default_and_type
    except ImportError:
        pass
