try:
    from passlib.context import CryptContext
    from jose import jwt
    print("✅ passlib and jose are installed and working.")
except ImportError as e:
    print(f"❌ Missing dependency: {e}")
except Exception as e:
    print(f"❌ Error: {e}")
