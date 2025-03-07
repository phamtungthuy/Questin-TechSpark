import os
import signal
import traceback
from concurrent.futures import ThreadPoolExecutor

from db.operations.init_db import init_database_tables
from db.operations.init_data import init_web_data
from api.settings import HOST, HTTP_PORT
import uvicorn
import time

def update_progress():
    from api.settings import stat_logger
    from db.db_services.document_service import DocumentService
    while True:
        time.sleep(3)
        try:
            DocumentService.update_progress()
        except Exception as e:
            stat_logger.error("update_progress exception:" + str(e))

if __name__ == '__main__':
    print("""
   ___  _   _ _____ ____ _____ ___ _   _ 
  / _ \| | | | ____/ ___|_   _|_ _| \ | |
 | | | | | | |  _| \___ \ | |  | ||  \| |
 | |_| | |_| | |___ ___) || |  | || |\  |
  \__\_\\___/|_____|____/ |_| |___|_| \_        
""", flush=True)
    
    # Init db
    init_database_tables()
    init_web_data()
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--version", default=False, help="questin version", action="store_true")
    parser.add_argument("--debug", default=False, help="debug mode", action='store_true')
    args = parser.parse_args()
    
    thr = ThreadPoolExecutor(max_workers=1)
    thr.submit(update_progress)
    
    try:
        uvicorn.run("api.core:app", host=HOST, port=8001, reload=True)
    except Exception:
        traceback.print_exc()
        os.kill(os.getpid(), signal.SIGKILL)