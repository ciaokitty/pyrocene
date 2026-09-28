"""Run the disposable lab on its own port. Never restart the main room server."""
import argparse
from stage4 import serve

FILES={'index.html','app.mjs','style.css','render.mjs','model.mjs','config.mjs'}
def create_server(host='127.0.0.1',port=8031):
    serve.APP_FILES=serve.APP_FILES|{'labs/vigilance/'+name for name in FILES}
    return serve.create_server(host,port)

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--host',default='127.0.0.1');p.add_argument('--port',type=int,default=8031);a=p.parse_args()
    server=create_server(a.host,a.port)
    print(f'Vigilance lab: http://{a.host}:{a.port}/labs/vigilance/index.html',flush=True)
    try:server.serve_forever()
    except KeyboardInterrupt:pass
    finally:server.server_close()
