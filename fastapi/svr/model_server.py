import uvicorn
import os
import traceback
import signal


if __name__ == '__main__':
    print("""
  __  __  ___  ____  _____ _        ___  _   _ _____ ____ _____ ___ _   _ 
 |  \/  |/ _ \|  _ \| ____| |      / _ \| | | | ____/ ___|_   _|_ _| \ | |
 | |\/| | | | | | | |  _| | |     | | | | | | |  _| \___ \ | |  | ||  \| |
 | |  | | |_| | |_| | |___| |___  | |_| | |_| | |___ ___) || |  | || |\  |
 |_|  |_|\___/|____/|_____|_____|  \__\_\\___/|_____|____/ |_| |___|_| \_|    
""", flush=True)
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--version", default=False, help="questin version", action="store_true")
    parser.add_argument("--debug", default=False, help="debug mode", action='store_true')
    args = parser.parse_args()
    
    try:
        uvicorn.run("api.model:app", host="0.0.0.0", port=8003)
    except Exception:
        traceback.print_exc()
        os.kill(os.getpid(), signal.SIGKILL)