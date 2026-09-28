// A local reference viewed through the field terminal, not a new observation.
export function phosphorImage(file, alt){
  const frame=document.createElement('figure');frame.className='phosphor-frame';
  const canvas=document.createElement('canvas');canvas.width=480;canvas.height=320;canvas.setAttribute('role','img');canvas.setAttribute('aria-label',alt);frame.append(canvas);
  const image=new Image();image.onload=()=>{
    const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.fillStyle='#081311';ctx.fillRect(0,0,480,320);
    const scale=Math.min(480/image.width,320/image.height),w=image.width*scale,h=image.height*scale;
    ctx.drawImage(image,(480-w)/2,(320-h)/2,w,h);
    const data=ctx.getImageData(0,0,480,320),p=data.data;
    for(let n=0;n<p.length;n+=4){const l=(p[n]*.21+p[n+1]*.72+p[n+2]*.07)/255,g=Math.pow(l,.82),line=Math.floor(n/4/480)%3===0?.76:1;p[n]=(9+g*138)*line;p[n+1]=(22+g*216)*line;p[n+2]=(17+g*157)*line;}
    ctx.putImageData(data,0,0);canvas.dataset.loaded='true';
  };
  image.onerror=()=>{frame.replaceChildren(document.createTextNode('Reference image unavailable.'));};image.src=file;
  return frame;
}
