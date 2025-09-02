import sys
import os
import importlib
from pathlib import Path

sys.path.insert(0, os.path.abspath("backend"))

def discover_and_run_tests():
    print("=== INICJALIZACJA TESTÓW BACKEND ===")
    
    test_dirs = {
        "jednostkowe": "testy_backend/jednostkowe",
        "funkcjonalne": "testy_backend/funkcjonalne"
    }
    
    for test_type, test_dir in test_dirs.items():
        if not Path(test_dir).exists():
            print(f"BŁĄD: Folder {test_dir} nie istnieje!")
            return
    
    print("\n=== URUCHAMIANIE TESTÓW JEDNOSTKOWYCH ===")
    run_tests_from_directory("testy_backend.jednostkowe")
    
    print("\n=== URUCHAMIANIE TESTÓW FUNKCJONALNYCH ===")
    run_tests_from_directory("testy_backend.funkcjonalne")
    
    print("\n=== WSZYSTKIE TESTY ZAKOŃCZONE ===")

def run_tests_from_directory(module_path):
    try:
        module = importlib.import_module(module_path)
        
        test_functions = [
            getattr(module, name) for name in dir(module)
            if name.startswith('test_') and callable(getattr(module, name))
        ]
        
        for test_func in test_functions:
            try:
                test_func()
            except Exception as e:
                print(f"BŁĄD w {test_func.__name__}: {e}")
                
    except ImportError as e:
        print(f"Nie można zaimportować modułu {module_path}: {e}")
    except Exception as e:
        print(f"Błąd podczas uruchamiania testów z {module_path}: {e}")

if __name__ == "__main__":
    discover_and_run_tests()