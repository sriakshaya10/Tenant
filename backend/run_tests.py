import os
import sys
import pytest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.chdir(os.path.dirname(os.path.abspath(__file__)))

print("Running test suite with pytest...", flush=True)
exit_code = pytest.main(["-v", "tests/"])
print(f"Pytest finished with exit code: {exit_code}", flush=True)
sys.exit(exit_code)
