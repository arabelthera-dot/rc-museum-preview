import * as THREE from './vendor/three.module.min.js';

(function(){
  'use strict';
  var root=document.querySelector('[data-house3d]');
  if(!root)return;
  var canvas=root.querySelector('[data-house3d-canvas]');
  var poster=root.querySelector('[data-house3d-poster]');
  var stageCopy=root.querySelector('[data-house3d-stage]');
  var progressCopy=root.querySelector('[data-house3d-progress]');
  var question=root.querySelector('[data-house3d-question]');
  var feedback=root.querySelector('[data-house3d-feedback]');
  var startButton=root.querySelector('[data-house3d-start]');
  var nextButton=root.querySelector('[data-house3d-next]');
  var stormButton=root.querySelector('[data-house3d-storm]');
  var partsBox=root.querySelector('[data-house3d-parts]');
  var reveal=document.querySelector('[data-house3d-reveal]');
  var replay=document.querySelector('[data-house3d-replay]');
  var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var scene,camera,renderer,clock,raycaster,pointer,snow,roof,route,outsideRoute,traveler,routeCurve,warmLight,stableLight;
  var initialized=false,running=false,started=false,storming=false,finished=false;
  var assembled=new Set(),partGroups={},targets={},exploded={},moveGoals={},cameraGoal,routeTravel=0,routeActive=false,roofGoalY=0,timers=[];
  var names={living:'Жилая изба',passage:'Сени',yard:'Двор и хлев',loft:'Сеновал'};
  var meanings={living:'Здесь печь держит тёплый центр дома.',passage:'Сени связали тепло и хозяйство, не выпуская человека прямо в метель.',yard:'Двор и хлев вошли в защищённый объём дома.',loft:'Сеновал поднял запас корма над хозяйственной частью.'};
  var order=['living','passage','yard','loft'];
  var prompts=['Найди тёплое ядро — объём, от которого начинается защищённый путь.','Чем связать жильё с холодной хозяйственной частью, не открывая её прямо в избу?','Какой объём позволит заботиться о животных, оставаясь под кровлей?','Куда поднять зимний запас корма, чтобы завершить вертикальную связь дома?'];
  var wrongHints=['Сначала нужен тёплый центр с печью — начни с жилой избы.','Между избой и хозяйством нужен буфер: найди сени.','Теперь присоедини пространство работы и животных — двор с хлевами.','Последним подними корм над хозяйственной частью — это сеновал.'];

  function schedule(fn,delay){var id=setTimeout(fn,delay);timers.push(id);return id;}
  function clearTimers(){timers.forEach(clearTimeout);timers=[];}
  function setFeedback(kind,title,copy){feedback.dataset.kind=kind;feedback.innerHTML='<b>'+title+'</b><span>'+copy+'</span>';}
  function updateJourney(active){
    root.querySelectorAll('[data-house-progress-part]').forEach(function(item){var id=item.dataset.houseProgressPart;item.classList.toggle('is-done',assembled.has(id));item.classList.toggle('is-active',id===active);item.querySelector('span').textContent=assembled.has(id)?'✓':String(order.indexOf(id)+1);});
  }
  function lockChoices(locked){partsBox.querySelectorAll('[data-house-part]').forEach(function(b){if(!assembled.has(b.dataset.housePart))b.disabled=locked;});}

  function fail(message){
    poster.hidden=false;
    poster.querySelector('span').textContent=message||'3D недоступно. Ниже открыта текстовая схема.';
    var alt=document.querySelector('.house3d-alt');if(alt)alt.open=true;
    startButton.disabled=true;
  }

  function woodTexture(){
    var c=document.createElement('canvas');c.width=256;c.height=64;var x=c.getContext('2d');
    x.fillStyle='#765039';x.fillRect(0,0,c.width,c.height);
    for(var i=0;i<85;i++){
      x.strokeStyle='rgba('+(i%3?48:235)+','+(i%3?29:188)+','+(i%3?18:115)+','+(i%3?.13:.08)+')';
      x.lineWidth=i%7===0?2:1;x.beginPath();var y=(i*17)%64;x.moveTo(0,y);
      x.bezierCurveTo(70,y-5+(i%9),170,y+4-(i%7),256,y+(i%5));x.stroke();
    }
    var t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(3,1);return t;
  }

  function setPartData(object,id){object.userData.housePart=id;object.traverse(function(n){n.userData.housePart=id;});}
  function logMesh(length,axis,material){
    var m=new THREE.Mesh(new THREE.CylinderGeometry(.14,.14,length,8,1,false),material);
    if(axis==='x')m.rotation.z=Math.PI/2;else m.rotation.x=Math.PI/2;
    m.castShadow=true;m.receiveShadow=true;return m;
  }
  function logRoom(id,width,depth,courses,material){
    var g=new THREE.Group(),y;
    for(var i=0;i<courses;i++){
      y=.18+i*.29;
      var a=logMesh(width,'x',material),b=logMesh(width,'x',material);a.position.set(0,y,depth/2);b.position.set(0,y,-depth/2);g.add(a,b);
      var c=logMesh(depth,'z',material),d=logMesh(depth,'z',material);c.position.set(width/2,y,0);d.position.set(-width/2,y,0);g.add(c,d);
    }
    var floor=new THREE.Mesh(new THREE.BoxGeometry(width,.16,depth),new THREE.MeshStandardMaterial({color:0x4d3426,roughness:.9}));floor.position.y=.05;floor.receiveShadow=true;g.add(floor);
    setPartData(g,id);return g;
  }
  function pane(group,x,y,z,w,h,color){
    var m=new THREE.Mesh(new THREE.BoxGeometry(w,h,.06),new THREE.MeshStandardMaterial({color:color,emissive:color,emissiveIntensity:.45,roughness:.4}));m.position.set(x,y,z);group.add(m);
  }
  function buildHouse(){
    var wood=new THREE.MeshStandardMaterial({map:woodTexture(),color:0xa8754d,roughness:.9,metalness:0});
    var darkWood=new THREE.MeshStandardMaterial({color:0x4e3426,roughness:.96});
    partGroups.living=logRoom('living',4.5,3.8,10,wood);targets.living=new THREE.Vector3(-3.15,0,0);pane(partGroups.living,0,1.35,1.94,1.2,.8,0xffc463);
    partGroups.passage=logRoom('passage',1.65,3.8,8,darkWood);targets.passage=new THREE.Vector3(.02,0,0);
    partGroups.yard=logRoom('yard',4.5,3.8,10,wood);targets.yard=new THREE.Vector3(3.15,0,0);pane(partGroups.yard,0,1.1,1.94,.8,.55,0xffb54f);
    partGroups.loft=logRoom('loft',4.5,3.8,5,darkWood);targets.loft=new THREE.Vector3(3.15,2.95,0);
    exploded.living=new THREE.Vector3(-6.8,.2,1.7);exploded.passage=new THREE.Vector3(-1.3,.4,-3.7);exploded.yard=new THREE.Vector3(5.6,.1,2.2);exploded.loft=new THREE.Vector3(4.7,4.8,-2.2);
    Object.keys(partGroups).forEach(function(k){partGroups[k].position.copy(targets[k]);scene.add(partGroups[k]);});

    roof=new THREE.Group();var roofMat=new THREE.MeshStandardMaterial({color:0x332a28,roughness:.96,transparent:true,opacity:.96,side:THREE.DoubleSide});
    [-1,1].forEach(function(side){var slab=new THREE.Mesh(new THREE.BoxGeometry(11.5,.18,3.05),roofMat);slab.position.set(0,4.04,side*1.25);slab.rotation.x=side*.43;slab.castShadow=true;roof.add(slab);});
    roof.position.x=.45;roof.userData.homeY=0;scene.add(roof);

    routeCurve=new THREE.CatmullRomCurve3([new THREE.Vector3(-4.1,1.15,.55),new THREE.Vector3(-2.2,1.15,.55),new THREE.Vector3(-.5,1.05,.55),new THREE.Vector3(1.6,1.05,.55),new THREE.Vector3(3.7,1.05,.55),new THREE.Vector3(3.7,3.25,.4)]);
    route=new THREE.Mesh(new THREE.TubeGeometry(routeCurve,70,.075,8,false),new THREE.MeshBasicMaterial({color:0xffcb5a,transparent:true,opacity:.98,depthTest:false}));route.visible=false;route.renderOrder=4;scene.add(route);
    var outsideCurve=new THREE.CatmullRomCurve3([new THREE.Vector3(-4.2,1,.6),new THREE.Vector3(-5.5,.35,3.4),new THREE.Vector3(1,.35,4.6),new THREE.Vector3(4.6,.8,2.1)]);
    outsideRoute=new THREE.Mesh(new THREE.TubeGeometry(outsideCurve,60,.055,7,false),new THREE.MeshBasicMaterial({color:0x78d5ff,transparent:true,opacity:.8,depthTest:false}));outsideRoute.visible=false;outsideRoute.renderOrder=4;scene.add(outsideRoute);
    traveler=new THREE.Mesh(new THREE.SphereGeometry(.18,16,12),new THREE.MeshBasicMaterial({color:0xffffff,depthTest:false}));traveler.visible=false;traveler.renderOrder=5;scene.add(traveler);
    warmLight=new THREE.PointLight(0xffa83d,0,9,2);warmLight.position.set(-2.7,1.4,1);scene.add(warmLight);
    stableLight=new THREE.PointLight(0xffbc55,0,7,2);stableLight.position.set(3.3,1.3,.8);scene.add(stableLight);
  }

  function makeSnow(){
    var count=innerWidth<700?550:1100,pos=new Float32Array(count*3);
    for(var i=0;i<count;i++){pos[i*3]=(Math.random()-.5)*25;pos[i*3+1]=Math.random()*13;pos[i*3+2]=(Math.random()-.5)*18;}
    var geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
    snow=new THREE.Points(geo,new THREE.PointsMaterial({color:0xf2fbff,size:1.45,sizeAttenuation:false,transparent:true,opacity:.78,depthWrite:false}));snow.userData.speed=.55;scene.add(snow);
  }
  function init(){
    if(initialized)return;initialized=true;
    if(!THREE||!THREE.WebGLRenderer){fail('Не загрузилась локальная 3D-библиотека. Ниже открыта текстовая схема.');return;}
    try{
      renderer=new THREE.WebGLRenderer({canvas:canvas,antialias:innerWidth>600,alpha:false,powerPreference:'high-performance'});
    }catch(e){fail('WebGL недоступен. Ниже открыта текстовая схема.');return;}
    renderer.setPixelRatio(Math.min(devicePixelRatio||1,innerWidth<700?1.35:1.65));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.shadowMap.enabled=!reduce&&(!navigator.deviceMemory||navigator.deviceMemory>3);renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    scene=new THREE.Scene();scene.background=new THREE.Color(0x10272d);scene.fog=new THREE.FogExp2(0x10272d,.032);
    camera=new THREE.PerspectiveCamera(38,1,.1,80);camera.position.copy(exteriorPosition());cameraGoal=camera.position.clone();clock=new THREE.Clock();raycaster=new THREE.Raycaster();pointer=new THREE.Vector2();
    scene.add(new THREE.HemisphereLight(0xbad5e4,0x15251d,1.7));
    var moon=new THREE.DirectionalLight(0xdcecff,2.1);moon.position.set(-7,11,8);moon.castShadow=renderer.shadowMap.enabled;moon.shadow.mapSize.set(1024,1024);moon.shadow.camera.left=-12;moon.shadow.camera.right=12;moon.shadow.camera.top=10;moon.shadow.camera.bottom=-8;scene.add(moon);
    var ground=new THREE.Mesh(new THREE.PlaneGeometry(32,22),new THREE.MeshStandardMaterial({color:0xd4e3e4,roughness:1}));ground.rotation.x=-Math.PI/2;ground.position.y=-.03;ground.receiveShadow=true;scene.add(ground);
    var lake=new THREE.Mesh(new THREE.PlaneGeometry(32,7),new THREE.MeshStandardMaterial({color:0x386270,roughness:.45,metalness:.15}));lake.rotation.x=-Math.PI/2;lake.position.set(0,-.01,-8);scene.add(lake);
    buildHouse();makeSnow();resize();poster.hidden=true;running=true;animate();
    canvas.addEventListener('pointerup',pickPart);canvas.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();var next=Object.keys(partGroups).find(function(k){return!assembled.has(k);});if(started&&next)selectPart(next);}});
    if('ResizeObserver'in window)new ResizeObserver(resize).observe(canvas.parentElement);else addEventListener('resize',resize);
  }
  function resize(){if(!renderer)return;var rect=canvas.parentElement.getBoundingClientRect(),w=Math.max(280,Math.round(rect.width)),h=Math.max(390,Math.round(rect.height));renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
  function lookAtHouse(){camera.lookAt(new THREE.Vector3(.2,1.8,0));}
  function animate(){
    if(!running)return;requestAnimationFrame(animate);var dt=Math.min(clock.getDelta(),.04);
    camera.position.lerp(cameraGoal,reduce?1:.045);lookAtHouse();
    if(snow){var p=snow.geometry.attributes.position.array,s=snow.userData.speed*(storming?4.4:1);if(!reduce||storming){for(var i=0;i<p.length;i+=3){p[i]-=dt*s*.65;p[i+1]-=dt*s;if(p[i+1]<0){p[i+1]=12;p[i]=(Math.random()-.5)*25;}if(p[i]<-13)p[i]=13;}snow.geometry.attributes.position.needsUpdate=true;}}
    if(started&&!reduce){Object.keys(partGroups).forEach(function(k){var g=partGroups[k];if(!assembled.has(k))g.rotation.y+=dt*.09;});}
    Object.keys(moveGoals).forEach(function(k){var g=partGroups[k];g.position.lerp(moveGoals[k],reduce?1:.09);if(g.position.distanceTo(moveGoals[k])<.025){g.position.copy(moveGoals[k]);delete moveGoals[k];}});
    roof.position.y+=(roofGoalY-roof.position.y)*(reduce?1:.065);
    if(routeActive&&traveler&&routeCurve){routeTravel=(routeTravel+dt*.16)%1;traveler.position.copy(routeCurve.getPointAt(routeTravel));}
    renderer.render(scene,camera);
  }
  function setGoal(x,y,z){cameraGoal.set(x,y,z);}
  function exteriorPosition(){return innerWidth<700?new THREE.Vector3(16,9,18.5):new THREE.Vector3(12,7.4,13.5);}
  function explode(){
    clearTimers();started=true;finished=false;storming=false;assembled.clear();moveGoals={};route.visible=false;outsideRoute.visible=false;traveler.visible=false;routeActive=false;warmLight.intensity=stableLight.intensity=0;roof.children.forEach(function(n){n.material.opacity=.94;});roof.position.y=0;roofGoalY=3.2;
    Object.keys(partGroups).forEach(function(k){partGroups[k].position.copy(exploded[k]);partGroups[k].rotation.set(0,0,0);var b=partsBox.querySelector('[data-house-part="'+k+'"]');b.disabled=false;b.classList.remove('is-done');});
    startButton.hidden=true;nextButton.hidden=true;stormButton.hidden=true;partsBox.hidden=false;reveal.hidden=true;stageCopy.textContent='Шаг 1 из 4 · найди источник тепла';progressCopy.textContent='0 / 4';question.textContent=prompts[0];setFeedback('prompt','Выбери первую часть','Нажми на объём в модели или на одну из четырёх подписанных кнопок. После каждого хода я объясню результат.');updateJourney('living');setGoal(13,8.6,15);
    if(innerWidth<700)setGoal(19,11,21);if(window.rcGoal)window.rcGoal('rc_game_start',{game:'house_against_blizzard_3d'});
  }
  function selectPart(id){
    if(!started||assembled.has(id)||finished)return;var g=partGroups[id],expected=order[assembled.size];
    if(id!==expected){
      var wrongButton=partsBox.querySelector('[data-house-part="'+id+'"]');wrongButton.classList.add('is-wrong');g.scale.set(1.08,.92,1.08);setFeedback('wrong','Пока неправильно: '+names[id],wrongHints[assembled.size]+' Попробуй ещё раз — ошибка ничего не сбрасывает.');schedule(function(){wrongButton.classList.remove('is-wrong');g.scale.set(1,1,1);},900);if(window.rcGoal)window.rcGoal('rc_game_attempt',{part:id,correct:false,step:assembled.size+1});return;
    }
    assembled.add(id);moveGoals[id]=targets[id];g.rotation.set(0,0,0);g.scale.set(1,1,1);
    var button=partsBox.querySelector('[data-house-part="'+id+'"]');button.disabled=true;button.classList.add('is-done');
    progressCopy.textContent=assembled.size+' / 4';stageCopy.textContent='Верно · '+names[id];question.textContent='Ты добавил: '+names[id];setFeedback('correct','✓ Правильно',meanings[id]+' Посмотри: выбранный объём занял своё место в доме.');updateJourney(assembled.size<4?order[assembled.size]:null);lockChoices(true);
    if(assembled.size===4){roofGoalY=0;nextButton.hidden=true;stormButton.hidden=false;stageCopy.textContent='Дом собран · осталось испытание';question.textContent='Сможет ли семья пройти к животным и сену, не выходя наружу?';setFeedback('correct','✓ Все четыре части под одной кровлей','Теперь запусти метель. Сначала увидишь опасный путь снаружи, затем — защищённый путь внутри дома.');stormButton.focus();}else{nextButton.hidden=false;nextButton.focus();}
    if(window.rcGoal)window.rcGoal('rc_game_step',{part:id,complete:assembled.size});
  }
  function pickPart(e){
    if(!started||finished)return;var r=canvas.getBoundingClientRect();pointer.x=((e.clientX-r.left)/r.width)*2-1;pointer.y=-((e.clientY-r.top)/r.height)*2+1;raycaster.setFromCamera(pointer,camera);
    var hits=raycaster.intersectObjects(Object.values(partGroups),true);if(hits.length){var id=hits[0].object.userData.housePart;if(id)selectPart(id);}
  }
  function finish(){
    if(assembled.size<4)return;clearTimers();storming=true;stormButton.hidden=true;stageCopy.textContent='Метель · путь снаружи';question.textContent='Без связи частей пришлось бы выйти прямо в непогоду';setFeedback('storm','Смотри на голубую линию','Это обход дома снаружи: снег, холод и лишний путь между жильём и хозяйством.');
    outsideRoute.visible=true;setGoal(11,6.4,12);canvas.scrollIntoView({behavior:reduce?'auto':'smooth',block:'center'});
    var revealRoute=function(){outsideRoute.visible=false;route.visible=true;traveler.visible=true;routeActive=true;warmLight.intensity=3.2;stableLight.intensity=2.4;roof.children.forEach(function(n){n.material.opacity=.18;});setPressedView('route');stageCopy.textContent='Открытие · путь внутри';question.textContent='Вот зачем весь дом собран под одной кровлей';setFeedback('final','Вау-момент: человек остаётся внутри','Золотая линия ведёт от печи через сени к животным и вверх, к сену. Общая кровля превращает огромный дом в защищённый зимний маршрут.');setGoal(.3,2.1,1.25);};
    if(reduce){revealRoute();setGoal(8,5.5,8);completeReveal();return;}
    schedule(revealRoute,1350);schedule(function(){setGoal(8,5.5,8);},3100);schedule(completeReveal,3600);
  }
  function completeReveal(){finished=true;stageCopy.textContent='Открытие · защищённый путь';progressCopy.textContent='4 / 4';reveal.hidden=false;if(window.rcGoal)window.rcGoal('rc_game_complete',{game:'house_against_blizzard_3d',total:4});}
  function setPressedView(view){root.querySelectorAll('[data-house-view]').forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.houseView===view));});}
  function view(view){
    if(view==='reset'){reset();return;}setPressedView(view);
    if(view==='exterior'){roof.children.forEach(function(n){n.material.opacity=.94;});cameraGoal.copy(exteriorPosition());}
    if(view==='cutaway'){roof.children.forEach(function(n){n.material.opacity=.18;});setGoal(10,8.8,2.5);}
    if(view==='route'){roof.children.forEach(function(n){n.material.opacity=.2;});route.visible=assembled.size===4;setGoal(8,5.5,8);}
  }
  function reset(){
    clearTimers();started=storming=finished=false;assembled.clear();moveGoals={};route.visible=false;outsideRoute.visible=false;traveler.visible=false;routeActive=false;warmLight.intensity=stableLight.intensity=0;roof.position.y=0;roofGoalY=0;roof.children.forEach(function(n){n.material.opacity=.94;});
    Object.keys(partGroups).forEach(function(k){partGroups[k].position.copy(targets[k]);partGroups[k].rotation.set(0,0,0);});
    startButton.hidden=false;nextButton.hidden=true;stormButton.hidden=true;partsBox.hidden=true;reveal.hidden=true;stageCopy.textContent='Архитектурное испытание';progressCopy.textContent='0 / 4';question.textContent='Как огромный дом защищал повседневную жизнь от непогоды?';setFeedback('intro','Твоя задача','Раскрой дом, собери четыре части и проверь свой маршрут настоящей северной метелью.');updateJourney(null);setPressedView('exterior');cameraGoal.copy(exteriorPosition());
  }
  startButton.addEventListener('click',function(){init();if(renderer)explode();});
  nextButton.addEventListener('click',function(){var next=order[assembled.size];nextButton.hidden=true;lockChoices(false);stageCopy.textContent='Шаг '+(assembled.size+1)+' из 4 · '+(['найди источник тепла','соедини части','добавь хозяйство','подними запас'][assembled.size]);question.textContent=prompts[assembled.size];setFeedback('prompt','Теперь следующий ход','Выбери часть, которая решает новую задачу. Смотри не на название, а на её роль в зимней жизни дома.');updateJourney(next);partsBox.querySelector('[data-house-part="'+next+'"]').focus();});
  stormButton.addEventListener('click',finish);
  root.querySelectorAll('[data-house-part]').forEach(function(b){b.addEventListener('click',function(){selectPart(b.dataset.housePart);});});
  root.querySelectorAll('[data-house-view]').forEach(function(b){b.addEventListener('click',function(){init();if(renderer)view(b.dataset.houseView);});});
  if(replay)replay.addEventListener('click',function(){reset();startButton.focus();root.scrollIntoView({behavior:reduce?'auto':'smooth',block:'center'});});
  if('IntersectionObserver'in window){
    var observer=new IntersectionObserver(function(entries){if(entries.some(function(e){return e.isIntersecting;})){init();observer.disconnect();}},{rootMargin:'300px'});observer.observe(root);
    var visibilityObserver=new IntersectionObserver(function(entries){document.body.classList.toggle('house3d-in-view',entries[0].isIntersecting);},{threshold:.12});visibilityObserver.observe(root);
  }else init();
})();
