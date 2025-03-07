#!/bin/bash
/usr/sbin/nginx

export LD_LIBRARY_PATH=/usr/lib/x86_64-linux-gnu/

PY=python3
if [[ -z "$WS" || $WS -lt 1 ]]; then
  WS=1
fi

function task_exe(){
  while [ 1 -eq 1 ];do  
    $PY svr/task_executor.py ;
  done
}

for ((i=0;i<WS;i++))
do
  task_exe  &
done

while [ 1 -eq 1 ];do  
  $PY svr/api_server.py
done &

while [ 1 -eq 1 ];do  
  $PY svr/chat_server.py
done &

while [ 1 -eq 1 ];do  
  $PY svr/model_server.py
done &

while [ 1 -eq 1 ];do  
  $PY svr/webhook_executor.py
done &

# while [ 1 -eq 1 ];do 
#   streamlit run agent/ui/main.py --server.fileWatcherType none --server.address 0.0.0.0 --server.baseUrlPath=streamlit
# done &

wait;
