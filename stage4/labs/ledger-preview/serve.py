"""Isolated design previews; do not restart the shared Cooperation server."""
import argparse
from stage4 import serve

def create_server(host='127.0.0.1',port=8032):
    serve.APP_FILES |= {'labs/ledger-preview/'+name for name in ('index.html','style.css','app.mjs')}
    return serve.create_server(host,port)

if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--host',default='127.0.0.1')
    parser.add_argument('--port',type=int,default=8032)
    args=parser.parse_args()
    server=create_server(args.host,args.port)
    print(f'Ledger previews: http://{args.host}:{args.port}/labs/ledger-preview/index.html',flush=True)
    try:server.serve_forever()
    except KeyboardInterrupt:pass
    finally:server.server_close()
