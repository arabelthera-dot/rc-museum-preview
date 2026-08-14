(function(){
  'use strict';
  document.addEventListener('DOMContentLoaded',function(){
    var lab=document.querySelector('[data-architecture-lab]');
    var follow=document.querySelector('[data-museum-follow]');
    if(!lab||!follow)return;
    function reveal(){
      if(!lab.classList.contains('is-solved'))return;
      follow.hidden=false;
      if(window.rcGoal)window.rcGoal('rc_follow_view',{channel:'rss',issue_id:'kolomenskoe'});
    }
    new MutationObserver(reveal).observe(lab,{attributes:true,attributeFilter:['class']});
    follow.addEventListener('click',function(event){
      var copy=event.target.closest('[data-follow-copy]');
      var link=event.target.closest('[data-follow-channel]');
      if(link&&window.rcGoal)window.rcGoal('rc_follow_click',{channel:'rss',issue_id:'kolomenskoe'});
      if(!copy)return;
      var url=new URL('feed.xml',location.href).href;
      if(navigator.clipboard){navigator.clipboard.writeText(url).then(function(){follow.querySelector('[data-follow-status]').textContent='Адрес ленты скопирован. Добавь его в приложение для чтения новостей.';});}
      else{follow.querySelector('[data-follow-status]').textContent='Адрес ленты: '+url;}
    });
  });
}());
