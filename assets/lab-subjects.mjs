import {wingAt, heliumAt} from './lab-physics.mjs';
const ns='http://www.w3.org/2000/svg';
function node(doc,tag,attrs={},parent){const n=doc.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);if(parent)parent.append(n);return n;}
function scene(panel,label,height,caption){
 const doc=panel.ownerDocument,svg=node(doc,'svg',{viewBox:`0 0 700 ${height}`,role:'img','aria-label':label},panel);
 svg.style.cssText='display:block;width:100%;height:auto;background:#162b3c;border-radius:10px';
 const text=doc.createElement('p');text.textContent=caption;panel.append(text);return {doc,svg};
}
export function registerSubjects(engine){
 engine.register('wing',{
  compile(c){
   const d=c.data;
   if(!d||!Array.isArray(d.rows)||!d.scale||!Number.isFinite(d.scale.qS_N)||d.scale.qS_N<=0)throw Error('Нет данных крыла');
   engine.table(d.rows.map(r=>[r[0],r[1]]),c.param);
   return n=>{const s=wingAt(d,n);return {values:[s.cl,s.lift],subject:s,verdict:s.phase==='after-peak'?'После измеренного максимума подъёмная сила упала. Увеличивать угол дальше — не значит поднимать сильнее.':s.phase==='near-peak'?'Приближаемся к измеренному максимуму. Сравни с положением после срыва.':'До максимума подъёмная сила растёт с углом.'};};
  },
  scene(panel,c){
   const {doc,svg}=scene(panel,'Профиль крыла и условная схема обтекания',240,c.caption);
   const flow=node(doc,'g',{fill:'none',stroke:'#79cce4','stroke-width':3},svg);
   const foil=node(doc,'g',{},svg);
   let upper=[],lower=[];for(let i=0;i<=60;i++){const x=i/60,y=.6*(.2969*Math.sqrt(x)-.126*x-.3516*x*x+.2843*x**3-.1015*x**4);upper.push(`${210+280*x},${128-280*y}`);lower.unshift(`${210+280*x},${128+280*y}`);}
   const profile=node(doc,'polygon',{points:upper.concat(lower).join(' '),fill:'#efc46c',stroke:'#fff1c9','stroke-width':2},foil);
   return {render({subject:s}){
    // In SVG y grows down: a positive angle raises the leading edge at the left.
    profile.setAttribute('transform',`rotate(${s.alpha} 350 128)`);flow.replaceChildren();
    const sep=s.phase==='after-peak';svg.dataset.phase=s.phase;
    [58,85,170,200].forEach((y,i)=>node(doc,'path',{d:`M 25 ${y} C 175 ${y}, 200 ${y-(i<2?25:0)}, 340 ${y-(i<2?20:0)} S 540 ${sep&&i<2?y-30:y}, 670 ${y}`},flow));
    if(sep)node(doc,'path',{stroke:'#ec966f',d:'M 420 90 C 470 20 550 30 540 78 C 530 115 475 100 492 67 M 535 88 C 600 25 665 58 630 105'},flow);
   }};
  }
 });
 engine.register('helium',{
  compile(c){
   const d=c.data,g=d?.geometry;
   if(!g||![g.width_mm,g.height_mm,g.initial_depth_mm,g.bath_level_mm].every(Number.isFinite)||g.width_mm<=0||g.height_mm<=0||g.initial_depth_mm<=0||g.initial_depth_mm>=g.height_mm||g.bath_level_mm>=0||!Array.isArray(g.tilt_range_deg)||g.tilt_range_deg.length!==2||!g.tilt_range_deg.every(Number.isFinite)||g.tilt_range_deg[0]!==0||g.tilt_range_deg[1]>60||c.param.min<0||c.param.max>g.tilt_range_deg[1])throw Error('Некорректная геометрия сосуда');
   return n=>{const s=heliumAt(d,n);return {values:[s.retained,s.spilled],subject:s,verdict:s.phase==='bulk-spill'?'Край достиг жидкости: к переносу по плёнке добавляется обычное переливание.':'Край выше жидкости. Обычного переливания нет; непрерывная плёнка соединяет жидкость с нижней ванной.'};};
  },
  scene(panel,c){
   const {doc,svg}=scene(panel,'Сосуд, горизонтальная поверхность гелия и плёнка на стенке',300,c.caption);
   return {render({subject:s}){
    svg.replaceChildren();svg.dataset.phase=s.phase;
    const xy=p=>`${380+p[0]*3},${225-p[1]*3}`,bathY=225-c.data.geometry.bath_level_mm*3;
    node(doc,'path',{d:`M 100 ${bathY} H 610 V ${bathY+10} H 100Z`,fill:'#347daf'},svg);
    node(doc,'polygon',{points:s.liquid.map(xy).join(' '),fill:'#347daf'},svg);
    node(doc,'polyline',{points:[s.cup[3],s.cup[0],s.cup[1],s.cup[2]].map(xy).join(' '),fill:'none',stroke:'#dfedf0','stroke-width':5},svg);
    node(doc,'polyline',{points:[s.cup[0],s.cup[3],[s.cup[3][0]-2,s.cup[3][1]],[s.cup[0][0]-2,s.cup[0][1]]].map(xy).join(' ')+` 240,${bathY}`,fill:'none',stroke:'#72deea','stroke-width':3,'stroke-dasharray':'5 4','data-film':'true'},svg);
    if(s.phase==='bulk-spill')node(doc,'path',{d:`M ${xy(s.cup[3])} Q 180 150 145 ${bathY}`,fill:'none',stroke:'#347daf','stroke-width':7,'data-spill':'true'},svg);
   }};
  }
 });
}
export function configurations(wing,helium){const peak=wing.rows.reduce((a,b)=>a[1]>b[1]?a:b)[0];return {
 wing:{title:'Поднять угол — потерять подъёмную силу',model:'wing',selectMarks:true,data:wing,param:{key:'alpha',label:'Угол атаки',unit:'°',min:wing.rows[0][0],max:wing.rows.at(-1)[0],step:.01,start:wing.initial_alpha_deg},outputs:[{key:'cl',label:'Коэффициент подъёмной силы'},{key:'lift',label:'Сила при условном qS = 1000 Н',unit:'Н'}],marks:[{at:wing.initial_alpha_deg,note:'Учебный старт'},{at:peak,note:'Максимум среди измеренных точек'},{at:wing.rows.at(-1)[0],note:'После максимума'}],source:wing.source_label || 'Ладсон, NASA TM 4074 (1988), NACA 0012; линейная интерполяция.',caption:wing.caption || 'Учебная схема NACA 0012. Линии потока условны; измерения не принадлежат Жуковскому.',resetLabel:'Вернуть начальный угол'},
 helium:{title:'Край ещё высоко — гелий переносится по плёнке',model:'helium',selectMarks:true,data:helium,param:{key:'tilt',label:'Наклон сосуда',unit:'°',min:0,max:60,step:1,start:0},outputs:[{key:'retained',label:'Площадь жидкого сечения в сосуде',unit:'мм²'},{key:'spilled',label:'Площадь сечения, ушедшая через край',unit:'мм²'}],marks:[{at:0,note:'Вертикальный сосуд'},{at:30,note:'Край выше жидкости'},{at:60,note:'Есть обычное переливание'}],source:'УФН, 1955, т.57, с.109–110, рис.38; геометрия рассчитана для учебного сечения.',caption:'Учебная геометрия 40 × 60 мм, начальная глубина 30 мм. Гелий-4 при выбранных 1,8 K; непрерывная плёнка соединена с нижней ванной. Плёнка увеличена; показан снимок до потерь по ней, а не течение во времени.',resetLabel:'Поставить вертикально'}
};}
