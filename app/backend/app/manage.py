"""CLI: python -m app.manage create-owner USERNAME   (password is read from the terminal, never from argv)"""
import getpass, sys
from . import auth, db
if __name__ == "__main__":
    if len(sys.argv) == 3 and sys.argv[1] == "create-owner":
        if auth.owner_exists(): sys.exit("owner already exists")
        pw = getpass.getpass("password (min 10 chars): ")
        if pw != getpass.getpass("repeat: "): sys.exit("passwords differ")
        auth.create_user(sys.argv[2], pw, "owner"); db.audit(None, "setup.owner_created_cli", sys.argv[2]); print("owner created")
    else: print(__doc__)
