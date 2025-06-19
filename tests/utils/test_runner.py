"""
Narzędzia do uruchamiania testów
"""
import sys
import os

# Kolory dla outputu
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    PURPLE = '\033[95m'
    CYAN = '\033[96m'
    END = '\033[0m'

def print_success(msg):
    print(f"{Colors.GREEN}✅ {msg}{Colors.END}")

def print_error(msg):
    print(f"{Colors.RED}❌ {msg}{Colors.END}")

def print_warning(msg):
    print(f"{Colors.YELLOW}⚠️  {msg}{Colors.END}")

def print_header(msg):
    print(f"{Colors.PURPLE}🧪 {msg}{Colors.END}")

def print_debug(msg):
    print(f"{Colors.CYAN}🔍 DEBUG: {msg}{Colors.END}")

# Globalne liczniki
total_tests = 0
passed_tests = 0
failed_tests = 0

def run_test(test_name, test_func):
    """Uruchamia pojedynczy test i zlicza wyniki"""
    global total_tests, passed_tests, failed_tests
    total_tests += 1
    
    try:
        test_func()
        print_success(f"{test_name}")
        passed_tests += 1
        return True
    except Exception as e:
        print_error(f"{test_name} - {str(e)}")
        failed_tests += 1
        return False

def get_test_stats():
    """Zwraca statystyki testów"""
    return {
        'total': total_tests,
        'passed': passed_tests,
        'failed': failed_tests,
        'success_rate': (passed_tests / total_tests * 100) if total_tests > 0 else 0
    }

def reset_test_stats():
    """Resetuje liczniki testów"""
    global total_tests, passed_tests, failed_tests
    total_tests = 0
    passed_tests = 0
    failed_tests = 0