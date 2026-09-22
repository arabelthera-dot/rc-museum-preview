export function wingAt(data,alpha){
 if(!Number.isFinite(alpha)||alpha<data.rows[0][0]||alpha>data.rows.at(-1)[0])throw new RangeError('Outside measured range');
 const i=data.rows.findIndex(r=>r[0]>=alpha),a=data.rows[Math.max(0,i-1)],b=data.rows[i];
 const t=a[0]===b[0]?0:(alpha-a[0])/(b[0]-a[0]);
 const cl=a[1]+t*(b[1]-a[1]);
 const peak=data.rows.reduce((p,r)=>r[1]>p[1]?r:p);
 return {alpha,cl,lift:cl*data.scale.qS_N,phase:alpha<=(data.near_peak_from_deg ?? 12.12)?'before-peak':alpha<=peak[0]?'near-peak':'after-peak',peak};
}
export function area(poly){return Math.abs(poly.reduce((s,p,i)=>{const q=poly[(i+1)%poly.length];return s+p[0]*q[1]-q[0]*p[1]},0))/2;}
export function below(poly,z){
 const out=[];
 for(let i=0;i<poly.length;i++){
  const a=poly[i],b=poly[(i+1)%poly.length],ina=a[1]<=z,inb=b[1]<=z;
  if(ina)out.push(a);
  if(ina!==inb){const t=(z-a[1])/(b[1]-a[1]);out.push([a[0]+t*(b[0]-a[0]),z]);}
 }
 return out;
}
export function heliumAt(data,angle){
 const g=data.geometry;
 if(!Number.isFinite(angle)||angle<g.tilt_range_deg[0]||angle>g.tilt_range_deg[1])throw new RangeError('Outside tilt range');
 const rad=angle*Math.PI/180,c=Math.cos(rad),s=Math.sin(rad),w=g.width_mm/2,h=g.height_mm;
 const transform=([x,z])=>[x*c-z*s,x*s+z*c];
 const cup=[[-w,0],[w,0],[w,h],[-w,h]].map(transform);
 const rim=Math.min(cup[2][1],cup[3][1]),initial=g.width_mm*g.initial_depth_mm;
 const retained=Math.min(initial,area(below(cup,rim)));
 let lo=Math.min(...cup.map(p=>p[1])),hi=rim;
 for(let i=0;i<70;i++){const mid=(lo+hi)/2;if(area(below(cup,mid))<retained)lo=mid;else hi=mid;}
 const level=(lo+hi)/2;
 return {angle,cup,liquid:below(cup,level),level,rim,retained,spilled:initial-retained,film:true,phase:initial-retained>1e-7?'bulk-spill':'film-only',rate:null};
}
