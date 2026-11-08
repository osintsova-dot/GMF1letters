/* Unit 3: observations are independent of legacy 1–5 scores. No network writes. */
var U3 = (function(){
  var skills=[
    ['listen','Понимает названия частей тела на слух','Показывает или выбирает названную часть тела.','понимает названия частей тела на слух'],
    ['name','Самостоятельно называет части тела','Показываем картинки без предварительного произнесения слова.','называет части тела по картинкам'],
    ['self','Описывает своего персонажа: I’ve got…','Просим описать рисунок: I’ve got a red nose / big ears. Повторение за учителем — помощь.','описывает своего персонажа с I’ve got…'],
    ['other','Описывает другого: He’s / She’s got…','Цвет глаз, длина и цвет волос, размер частей тела. Фиксируйте конкретную ошибку ниже.','описывает другого персонажа с He’s / She’s got…'],
    ['detail','Понимает описание внешности на слух','Выбирает персонажа по нескольким признакам, без перевода описания.','выбирает персонажа по описанию внешности'],
    ['digraph','Читает слова с ou / oi / ue / er / ar','Проверяем чтение отдельных слов. Примеры: out, coin, glue, her, star.','читает слова с изученными сочетаниями ou / oi / ue / er / ar'],
    ['magic','Читает слова с a-e','Примеры из блока: cake, name, game, late. Не выводим чтение из оценки за лексику.','читает слова с a-e, например cake, name']
  ];
  var levels=[['','Не проверяли / нет данных'],['independent','Самостоятельно, верно'],['partial','Самостоятельно, с ошибками / частично'],['support','С образцом или подсказкой'],['difficulty','Пока трудно даже с помощью']];
  var fields=[['example','Конкретный пример или затруднение','Например: называет eyes / ears, путает arms / hands.'],['testComment','Что показали задания теста','Только проверенное: например, выбирает картинку по описанию; ошибается в письменных предложениях.'],['baseline','Раньше → сейчас (если есть сопоставимое наблюдение)','Необязательно. Без стартовой записи динамику не придумываем.'],['school','Что делаем на ближайших уроках','Подтвердите или отредактируйте предложенный шаг.'],['home','Одна рекомендация домой','Посильное действие по выбранному умению.'],['check','Когда и как проверим продвижение','Например: через два занятия — описание нового персонажа.']];
  var plans={
    listen:['Повторим названия частей тела в игре «Покажи»: сначала с картинкой-подсказкой, затем без неё.','В знакомом задании «Урока дома» потренировать выбор части тела на слух.'],
    name:['Потренируем называние частей тела в коротких играх с картинками, постепенно убирая речевые подсказки.','Предложить ребёнку назвать части тела на рисунке персонажа; при затруднении обратиться к образцу из урока.'],
    self:['Потренируем описание своего персонажа с I’ve got…: сначала по речевой опоре, затем без неё.','Нарисовать смешного персонажа и описать его двумя предложениями с I’ve got…; образец из урока оставить рядом.'],
    other:['Потренируем описание разных персонажей с He’s / She’s got…, постепенно убирая речевой образец.','Выбрать персонажа на знакомой картинке и описать его двумя предложениями с He’s / She’s got… по образцу из урока.'],
    detail:['Потренируем выбор персонажа по описанию: сначала по одному признаку, затем по нескольким.','Повторить знакомое задание на понимание описания в «Уроке дома».'],
    digraph:['Повторим те сочетания букв, которые вызывают затруднения, и прочитаем с ними короткие слова.','Перечитать несколько слов с трудным сочетанием из тетради Phonics Hero; при необходимости сначала послушать образец.'],
    magic:['Сопоставим cap — cape и потренируем чтение слов с a-e, постепенно убирая подсказку о конечной e.','Перечитать знакомые слова cake, name, game из тетради; обратить внимание на конечную e.']
  };
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function id(prefix,k){return 'u3_'+prefix+'_'+k;}
  function read(prefix){var d={version:1};skills.concat(fields).concat([['focus']]).forEach(function(f){var e=document.getElementById(id(prefix,f[0]));d[f[0]]=e?e.value:'';});return d;}
  function write(prefix,d){skills.concat(fields).concat([['focus']]).forEach(function(f){var e=document.getElementById(id(prefix,f[0]));if(e)e.value=d&&d[f[0]]||'';});}
  function identity(prefix){var e=document.getElementById(prefix==='one'?'cname':prefix+'_name');return e?e.value.trim():'';}
  function key(prefix){return 'ss_u3draft_v1_'+(currentTeacher||'')+'||'+identity(prefix);}
  function remember(prefix){if(!identity(prefix))return;try{localStorage.setItem(key(prefix),JSON.stringify(read(prefix)));}catch(e){document.getElementById(id(prefix,'status')).textContent='Не удалось сохранить черновик. Скопируйте готовый отчёт.';}}
  function load(prefix){var d=null;try{var n=identity(prefix);var saved=n?JSON.parse(localStorage.getItem(makeKey(currentTeacher||'',n,3))||'null'):null;d=n?JSON.parse(localStorage.getItem(key(prefix))||'null'):null;d=d||(saved&&saved.u3);}catch(e){}write(prefix,d||{});}
  function panel(prefix){var box=document.createElement('section');box.className='u3-panel';box.id=id(prefix,'panel');
    box.innerHTML='<h3>Unit 3 · Что получилось у ребёнка</h3><p>Итоговый отчёт после теста. Отмечайте только проверенное на уроках и в тесте. Незаполненные умения не превращаются в низкую оценку. Черновик сохраняется на этом устройстве по имени ребёнка и педагога.</p>'+skills.map(function(f){return '<div class="u3-skill"><label for="'+id(prefix,f[0])+'"><strong>'+f[1]+'</strong></label><small>'+f[2]+'</small><select id="'+id(prefix,f[0])+'">'+levels.map(function(l){return '<option value="'+l[0]+'">'+l[1]+'</option>';}).join('')+'</select></div>';}).join('')+
    '<div class="u3-field"><label for="'+id(prefix,'focus')+'">Главный следующий шаг</label><select id="'+id(prefix,'focus')+'"><option value="">Выберите одно умение</option>'+skills.map(function(f){return '<option value="'+f[0]+'">'+f[1]+'</option>';}).join('')+'</select><div class="u3-actions"><button type="button" data-suggest>Предложить поддержку</button></div><p>Для уверенно освоенного умения можно выбрать усложнение и описать его вручную. Предложение не заменяет решение учителя.</p></div>'+fields.map(function(f){return '<div class="u3-field"><label for="'+id(prefix,f[0])+'">'+f[1]+'</label><textarea id="'+id(prefix,f[0])+'" placeholder="'+esc(f[2])+'"></textarea></div>';}).join('')+'<div class="u3-status" id="'+id(prefix,'status')+'" role="status"></div>';
    box.addEventListener('input',function(){remember(prefix);});box.addEventListener('change',function(){remember(prefix);});
    box.querySelector('[data-suggest]').onclick=function(){var d=read(prefix),p=plans[d.focus];if(!p)return;if(d[d.focus]==='independent'){document.getElementById(id(prefix,'status')).textContent='Умение освоено: выберите усложнение и опишите его в следующих шагах.';return;}if(!d[d.focus]){document.getElementById(id(prefix,'status')).textContent='Сначала отметьте результат по выбранному умению.';return;}if(!d.school)document.getElementById(id(prefix,'school')).value=p[0];if(!d.home)document.getElementById(id(prefix,'home')).value=p[1];document.getElementById(id(prefix,'status')).textContent='Проверьте предложение. Уже введённый текст сохранён.';remember(prefix);};return box;
  }
  function report(name,teacher,d,att,of,online,hw,app,ts,tt,note){var lines=['📝 Итоги Unit 3 · At the circus — В цирке','👤 '+name,''];
    var good=[],work=[],reading=[];skills.forEach(function(f){var l=d[f[0]];if(!l)return;var sentence=f[3];var t=l==='independent'?'Самостоятельно '+sentence+'.':l==='partial'?'Частично получается: '+sentence+'; в проверенных примерах есть ошибки.':l==='support'?'С образцом или подсказкой '+sentence+'.':'Пока вызывает затруднения даже с поддержкой: '+sentence+'.';if(f[0]==='digraph'||f[0]==='magic')reading.push(t);else if(l==='independent')good.push(t);else work.push(t);});
    function section(title,a){if(a.length)lines.push(title,a.join('\n'),'');}
    section('Что уже получается',good);section('Что пока требует поддержки',work);section('📖 Чтение',reading);
    if(!good.length&&!work.length&&!reading.length)lines.push('Наблюдения по умениям пока не внесены.','');
    section('Конкретный пример',[d.example].filter(Boolean));section('Продвижение',[d.baseline].filter(Boolean));
    var hasScore=ts!==''&&ts!=null&&Number.isFinite(Number(ts))&&Number(ts)>=0;
    if(hasScore){var max=Number(tt);lines.push('📝 Тест: '+ts+(tt!==''&&max>0?' из '+tt+' баллов ('+Math.round(Number(ts)/max*100)+'%).':' баллов.'),'');}else lines.push('Результат теста пока не внесён.','');
    section('По заданиям теста',[d.testComment].filter(Boolean));
    var focus=skills.find(function(f){return f[0]===d.focus;});if(focus&&d[focus[0]])section('Следующий шаг',[focus[1]+'.']);
    section('На ближайших уроках',[d.school].filter(Boolean));section('Дома',[d.home].filter(Boolean));section('Повторная проверка',[d.check].filter(Boolean));
    var stats=[];if(att!==''&&att!=null)stats.push('Посещение: '+att+' из '+(of||UNITS[3].att)+' уроков.');if(online==='yes')stats.push('Пропуски отработаны онлайн.');if(online==='partial')stats.push('Пропуски отработаны частично.');if(online==='no')stats.push('Пропуски пока не отработаны.');if(hw!==''&&hw!=null)stats.push('Домашние задания: '+hw+'% выполнено.');if(app)stats.push('Тренировки в приложении: '+({always:'регулярно',sometimes:'иногда',rarely:'редко',never:'не зафиксированы'}[app]||app)+'.');section('Учебная практика',stats);section('Комментарий педагога',[note].filter(Boolean));lines.push('С уважением, команда Speak&Smile | '+(teacher||'[педагог]'));return lines.join('\n').replace(/…\./g,'…');
  }
  function refresh(){document.getElementById(id('one','panel')).hidden=S.ui!==3;['vrow','grow','arow'].forEach(function(k){document.getElementById(k).closest('.field').hidden=S.ui===3;});for(var i=1;i<=12;i++){document.getElementById(id('p'+i,'panel')).hidden=GS.ui!==3;document.querySelectorAll('[data-pupil="'+i+'"] .mini-scores').forEach(function(e){e.closest('.pupil-field').hidden=GS.ui===3;});}}
  function init(){var one=panel('one');document.getElementById('vrow').closest('.field').before(one);for(var i=1;i<=12;i++){var prefix='p'+i;document.querySelector('[data-pupil="'+i+'"]').appendChild(panel(prefix));}['one'].concat(Array.from({length:12},function(_,i){return 'p'+(i+1);})).forEach(function(prefix){var e=document.getElementById(prefix==='one'?'cname':prefix+'_name');e.addEventListener('input',function(){load(prefix);});load(prefix);});
    var old=selUnit;selUnit=function(){old.apply(this,arguments);refresh();};
    var oldShow=showUnitData;showUnitData=function(name,ui){var d=JSON.parse(localStorage.getItem(makeKey(currentTeacher,name,ui))||'null');if(ui!==3||!d||!d.u3)return oldShow(name,ui);alert(report(name,d.teacher,d.u3,d.att,d.attOf,d.online,d.hw,d.app,d.ts,d.tt,d.note));};
    var oldTeacher=setTeacher;setTeacher=function(){oldTeacher.apply(this,arguments);["one"].concat(Array.from({length:12},function(_,i){return "p"+(i+1);})).forEach(load);};
    refresh();
  }
  return {read:read,report:report,escape:esc,init:init};
})();
window.addEventListener('load',function(){U3.init();});
