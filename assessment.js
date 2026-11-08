/* Criterion-based GMF1 reports. Legacy Unit 3 records are read without conversion. */
var Assessment = (function () {
  var prefixes = ['one'];
  for (var number = 1; number <= 12; number++) prefixes.push('p' + number);

  var levels = [
    ['', 'Не проверяли / нет данных'],
    ['independent', 'Самостоятельно, верно'],
    ['partial', 'Самостоятельно, с ошибками / частично'],
    ['support', 'С образцом или подсказкой'],
    ['difficulty', 'Пока трудно даже с помощью']
  ];
  var fields = [
    ['example', 'Конкретный пример или затруднение', 'Запишите ответ ребёнка или конкретную ошибку в проверенном задании.'],
    ['testComment', 'Что показали задания теста', 'Укажите умение и задание, по которому сделан вывод.'],
    ['baseline', 'Раньше → сейчас', 'Заполняйте, если есть сопоставимое предыдущее наблюдение.'],
    ['school', 'Что делаем на ближайших уроках', 'Проверьте и отредактируйте предложенный шаг.'],
    ['home', 'Одна рекомендация домой', 'Посильное действие по выбранному умению.'],
    ['check', 'Когда и как проверим продвижение', 'Укажите срок и похожее задание для повторной проверки.']
  ];

  function escape(text) {
    var entities = {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'};
    return String(text == null ? '' : text).replace(/[&<>"']/g, function (character) {
      return entities[character];
    });
  }

  function id(prefix, field) { return 'assessment_' + prefix + '_' + field; }
  function element(prefix, field) { return document.getElementById(id(prefix, field)); }
  function unitIndex(prefix) { return prefix === 'one' ? S.ui : GS.ui; }
  function inputId(prefix, field) { return prefix === 'one' ? field : prefix + '_' + field; }
  function pupilName(prefix) { return document.getElementById(inputId(prefix, prefix === 'one' ? 'cname' : 'name')).value.trim(); }
  function savedData(name, index) { return parseStorage(makeKey(currentTeacher, name, index)); }

  function parseStorage(key) {
    try { return JSON.parse(localStorage.getItem(key) || 'null'); }
    catch (error) { return null; }
  }

  function draftKey(name, index) {
    return 'ss_assessment_v2_' + currentTeacher + '||' + name + '||' + index;
  }

  function read(prefix) {
    var index = unitIndex(prefix);
    var data = {version: 2, unitIdx: index};
    var keys = GMF1_ASSESSMENTS[index].skills.map(function (skill) { return skill.key; });
    fields.forEach(function (field) { keys.push(field[0]); });
    keys.push('focus');
    keys.forEach(function (key) {
      var input = element(prefix, key);
      data[key] = input ? input.value : '';
    });
    return data;
  }

  function attOf(prefix) {
    if (prefix === 'one') return document.getElementById('att').dataset.of || '';
    return PS[Number(prefix.slice(1))].of || '';
  }

  function readPractice(prefix) {
    var state = prefix === 'one' ? S : PS[Number(prefix.slice(1))];
    var practice = {online: state.o, app: state.app, attOf: attOf(prefix)};
    ['att', 'hw', 'ts', 'note'].forEach(function (key) {
      practice[key] = document.getElementById(inputId(prefix, key)).value;
    });
    practice.tt = document.getElementById(prefix === 'one' ? 'tt' : 'gTestTotal').value;
    return practice;
  }

  function status(prefix, message) {
    var output = element(prefix, 'status');
    if (output) output.textContent = message;
  }

  function remember(prefix) {
    if (!element(prefix, 'panel')) return;
    var name = pupilName(prefix);
    if (!name) return;
    try {
      localStorage.setItem(draftKey(name, unitIndex(prefix)), JSON.stringify({
        assessment: read(prefix), practice: readPractice(prefix)
      }));
    } catch (error) {
      status(prefix, 'Не удалось сохранить черновик на устройстве. Скопируйте готовый отчёт.');
    }
  }

  function modePrefixes(mode) { return mode === 'group' ? prefixes.slice(1) : ['one']; }
  function rememberMode(mode) { modePrefixes(mode).forEach(remember); }

  function writePractice(prefix, practice) {
    practice = practice || {};
    ['att', 'hw', 'ts', 'note'].forEach(function (key) {
      var value = practice[key];
      document.getElementById(inputId(prefix, key)).value = value == null ? '' : value;
    });
    var index = unitIndex(prefix);
    var maximum = practice.attOf || UNITS[index].att;
    var attendance = document.getElementById(inputId(prefix, 'att'));
    attendance.max = maximum;
    if (prefix === 'one') {
      attendance.dataset.of = practice.attOf || '';
      document.getElementById('attMax').textContent = '/ ' + maximum + ' уроков';
      document.getElementById('tt').value = practice.tt == null ? '' : practice.tt;
      S.o = practice.online || '';
      S.app = practice.app || '';
      updPct();
    } else {
      var pupil = Number(prefix.slice(1));
      PS[pupil].of = practice.attOf || '';
      PS[pupil].o = practice.online || '';
      PS[pupil].app = practice.app || '';
      document.getElementById(prefix + '_attlab').textContent = 'Посещ. / ' + maximum;
    }
    var optionSets;
    if (prefix === 'one') {
      optionSets = [
        [document.querySelectorAll('#orow .obtn'), practice.online],
        [document.querySelectorAll('#approw .obtn'), practice.app]
      ];
    } else {
      var row = document.querySelector('[data-pupil="' + prefix.slice(1) + '"]');
      optionSets = [
        [row.querySelectorAll('button[onclick*="\'o\'"]'), practice.online],
        [row.querySelectorAll('button[onclick*="\'app\'"]'), practice.app]
      ];
    }
    optionSets.forEach(function (set) {
      set[0].forEach(function (button) {
        var selected = !!set[1] && button.getAttribute('onclick').includes("'" + set[1] + "'");
        button.classList.toggle('on', selected);
      });
    });
  }

  function load(prefix) {
    var index = unitIndex(prefix);
    var name = pupilName(prefix);
    var saved = name ? savedData(name, index) : null;
    var draft = name ? parseStorage(draftKey(name, index)) : null;
    var observation = draft && draft.assessment;
    if (!observation && saved) observation = saved.assessment;
    if (!observation && index === 3 && name) {
      observation = parseStorage('ss_u3draft_v1_' + currentTeacher + '||' + name);
      if (!observation && saved) observation = saved.u3;
    }
    observation = observation || {};
    var panel = element(prefix, 'panel');
    panel.querySelectorAll('select, textarea').forEach(function (input) {
      var key = input.dataset.field;
      input.value = observation[key] || '';
    });
    writePractice(prefix, (draft && draft.practice) || saved);
    status(prefix, '');
  }

  function makeSelect(prefix, key, options) {
    return '<select id="' + id(prefix, key) + '" data-field="' + key + '">' +
      options.map(function (option) {
        return '<option value="' + escape(option[0]) + '">' + escape(option[1]) + '</option>';
      }).join('') + '</select>';
  }

  function suggest(prefix) {
    var data = read(prefix);
    var skill = GMF1_ASSESSMENTS[unitIndex(prefix)].skills.find(function (item) {
      return item.key === data.focus;
    });
    if (!skill || !data[skill.key]) {
      status(prefix, 'Выберите умение и отметьте результат его проверки.');
      return;
    }
    if (data[skill.key] === 'independent') {
      status(prefix, 'Умение освоено. Опишите усложнение в следующих шагах.');
      return;
    }
    if (!data.school.trim()) element(prefix, 'school').value = skill.school;
    if (!data.home.trim()) element(prefix, 'home').value = skill.home;
    status(prefix, 'Проверьте предложенные действия и уточните задание и срок повторной проверки.');
    remember(prefix);
  }

  function renderPanel(prefix) {
    var index = unitIndex(prefix);
    var config = GMF1_ASSESSMENTS[index];
    var panel = element(prefix, 'panel');
    if (!panel) {
      panel = document.createElement('section');
      panel.className = 'assessment-panel';
      panel.id = id(prefix, 'panel');
      if (prefix === 'one') document.getElementById('vrow').closest('.field').before(panel);
      else document.querySelector('[data-pupil="' + prefix.slice(1) + '"]').appendChild(panel);
    }
    var subtitle = index === 0 ? 'Итоги Starter по наблюдениям на уроках.' : 'Итоговый отчёт после теста.';
    var html = '<h3>' + escape(config.title) + '</h3><p>' + subtitle +
      ' Отмечайте только проверенное. Уточняйте частичный результат в конкретном примере. ' +
      'Черновик сохраняется на этом устройстве по педагогу, ребёнку и блоку.</p>';
    config.skills.forEach(function (skill) {
      html += '<div class="assessment-skill"><label for="' + id(prefix, skill.key) + '"><strong>' +
        escape(skill.label) + '</strong></label><small>' + escape(skill.hint) + '</small>' +
        makeSelect(prefix, skill.key, levels) + '</div>';
    });
    var focusOptions = [['', 'Выберите одно умение']].concat(config.skills.map(function (skill) {
      return [skill.key, skill.label];
    }));
    html += '<div class="assessment-field"><label for="' + id(prefix, 'focus') + '">Главный следующий шаг</label>' +
      makeSelect(prefix, 'focus', focusOptions) + '<div class="assessment-actions">' +
      '<button type="button" data-suggest>Предложить поддержку</button></div></div>';
    fields.forEach(function (field) {
      if (index === 0 && field[0] === 'testComment') return;
      html += '<div class="assessment-field"><label for="' + id(prefix, field[0]) + '">' + field[1] +
        '</label><textarea id="' + id(prefix, field[0]) + '" data-field="' + field[0] +
        '" placeholder="' + escape(field[2]) + '"></textarea></div>';
    });
    panel.innerHTML = html + '<div class="assessment-status" id="' + id(prefix, 'status') + '" role="status"></div>';
    panel.querySelector('[data-suggest]').onclick = function () { suggest(prefix); };
    load(prefix);
  }

  function selectUnit(mode) {
    modePrefixes(mode).forEach(renderPanel);
    if (mode === 'group') {
      var maximum = parseStorage('ss_assessment_max_' + currentTeacher + '||' + GS.ui);
      if (maximum == null) {
        for (var pupil = 1; pupil <= 12; pupil++) {
          var name = pupilName('p' + pupil);
          var saved = name && savedData(name, GS.ui);
          if (saved && saved.tt != null && saved.tt !== '') { maximum = saved.tt; break; }
        }
      }
      document.getElementById('gTestTotal').value = maximum == null ? '' : maximum;
      document.getElementById('gTestTotal').closest('.field').hidden = GS.ui === 0;
      for (var number = 1; number <= 12; number++) {
        document.getElementById('p' + number + '_ts').closest('.pupil-field').hidden = GS.ui === 0;
      }
    }
  }

  function report(name, teacher, index, data, practice) {
    var config = GMF1_ASSESSMENTS[index];
    data = data || {};
    practice = practice || {};
    var lines = ['📝 Итоги ' + config.title, '👤 ' + name, ''];
    var successes = [], developing = [], reading = [];
    config.skills.forEach(function (skill) {
      var level = data[skill.key];
      if (!level) return;
      var sentence;
      switch (level) {
        case 'independent': sentence = 'Самостоятельно ' + skill.statement + '.'; break;
        case 'partial': sentence = 'Частично получается ' + skill.action + '. В проверенных примерах есть ошибки.'; break;
        case 'support': sentence = 'С образцом или подсказкой ' + skill.statement + '.'; break;
        case 'difficulty': sentence = 'Пока трудно ' + skill.action + ', даже с поддержкой.'; break;
        default: return;
      }
      if (skill.reading) reading.push(sentence);
      else if (level === 'independent') successes.push(sentence);
      else developing.push(sentence);
    });
    function section(heading, contents) {
      var entries = contents.filter(function (text) { return text && String(text).trim(); });
      if (entries.length) lines.push(heading, entries.join('\n'), '');
    }
    section('Что уже получается', successes);
    section('Что пока требует поддержки', developing);
    section('📖 Чтение', reading);
    if (!successes.length && !developing.length && !reading.length) {
      lines.push('Наблюдения по умениям пока не внесены.', '');
    }
    section('Конкретный пример', [data.example]);
    section('Продвижение', [data.baseline]);
    if (UNITS[index].hasTest) {
      var score = Number(practice.ts), maximum = Number(practice.tt);
      var hasScore = practice.ts !== '' && practice.ts != null && Number.isFinite(score) && score >= 0;
      if (hasScore && maximum > 0 && score <= maximum) {
        lines.push('📝 Тест — ' + score + ' из ' + maximum + ' баллов (' + Math.round(score / maximum * 100) + '%).', '');
      } else if (hasScore && !(maximum > 0)) {
        lines.push('📝 Тест — ' + score + ' баллов.', '');
      } else {
        lines.push('Результат теста пока не внесён или требует уточнения.', '');
      }
      section('По заданиям теста', [data.testComment]);
    }
    var focus = config.skills.find(function (skill) { return skill.key === data.focus; });
    if (focus && data[focus.key]) section('Следующий шаг', [focus.label]);
    section('На ближайших уроках', [data.school]);
    section('Дома', [data.home]);
    section('Повторная проверка', [data.check]);
    var statistics = [];
    if (practice.att !== '' && practice.att != null) {
      var total = practice.attOf === '' || practice.attOf == null ? UNITS[index].att : practice.attOf;
      statistics.push('Посещение — ' + practice.att + ' из ' + total + ' уроков.');
    }
    var online = {yes: 'Пропуски отработаны онлайн.', partial: 'Пропуски отработаны частично.', no: 'Пропуски пока не отработаны.'};
    if (online[practice.online]) statistics.push(online[practice.online]);
    if (practice.hw !== '' && practice.hw != null) statistics.push('Домашние задания — ' + practice.hw + '% выполнено.');
    var app = {always: 'регулярно', sometimes: 'иногда', rarely: 'редко', never: 'не зафиксированы'};
    if (app[practice.app]) statistics.push('Тренировки в приложении — ' + app[practice.app] + '.');
    section('Учебная практика', statistics);
    section('Комментарий педагога', [practice.note]);
    lines.push('С уважением, команда Speak&Smile | ' + (teacher || '[педагог]'));
    return lines.join('\n').replace(/…\./g, '…');
  }

  function preserveLegacyScores(key, data) {
    var previous = parseStorage(key);
    if (!previous) return;
    if (previous.legacyScores) data.legacyScores = previous.legacyScores;
    else if (previous.v || previous.g || previous.a) {
      data.legacyScores = {v: previous.v, g: previous.g, a: previous.a};
    }
  }

  function showSavedUnit(name, index) {
    var data = savedData(name, index);
    if (!data) { alert('Сохранённых данных по этому блоку пока нет.'); return; }
    var observations = data.assessment || (index === 3 && data.u3);
    if (observations) {
      alert(report(name, data.teacher, index, observations, data));
      return;
    }
    var lines = [GMF1_ASSESSMENTS[index].title, 'Ранее сохранённые оценки',
      'Лексика — ' + (data.v || '—') + '/5', 'Грамматика — ' + (data.g || '—') + '/5',
      'Активность — ' + (data.a || '—') + '/5'];
    if (data.ts !== '' && data.ts != null) lines.push('Тест — ' + data.ts + ' из ' + (data.tt || '—'));
    if (data.note) lines.push(data.note);
    alert(lines.join('\n'));
  }

  function showYear(name) {
    var reports = [];
    GMF1_ASSESSMENTS.forEach(function (config) {
      var saved = savedData(name, config.index);
      if (!saved) return;
      var observation = saved.assessment || (config.index === 3 && saved.u3);
      if (observation) {
        var blockReport = report(name, saved.teacher, config.index, observation, saved);
        if (saved.legacyScores) {
          blockReport += '\n\nРанее сохранённые оценки\nЛексика — ' + (saved.legacyScores.v || '—') +
            '/5 · Грамматика — ' + (saved.legacyScores.g || '—') + '/5 · Активность — ' + (saved.legacyScores.a || '—') + '/5';
        }
        reports.push(blockReport);
      }
      else {
        reports.push(config.title + '\nРанее сохранённые оценки\nЛексика — ' + (saved.v || '—') +
          '/5 · Грамматика — ' + (saved.g || '—') + '/5 · Активность — ' + (saved.a || '—') +
          '/5\nПосещение — ' + (saved.att === '' ? '—' : saved.att) + ' из ' + (saved.attOf || UNITS[config.index].att) +
          '\nТест — ' + (saved.ts === '' ? '—' : saved.ts) + ' из ' + (saved.tt || '—') + '\n' + (saved.note || ''));
      }
    });
    var text = 'Итоги по сохранённым блокам GMF1\n' + name + '\nСохранены результаты ' + reports.length +
      ' из ' + UNITS.length + ' блоков.\n\n' + reports.join('\n\n────────────\n\n');
    document.getElementById('yearTitle').textContent = 'Годовой отчёт · ' + name;
    var contents = document.getElementById('yearContent');
    contents.replaceChildren();
    var copy = document.createElement('button');
    copy.className = 'cpbtn';
    copy.textContent = 'Копировать отчёт';
    copy.onclick = function () { cpText(text, copy); };
    contents.appendChild(copy);
    var summary = document.createElement('div');
    summary.className = 'year-summary';
    summary.style.whiteSpace = 'pre-wrap';
    summary.textContent = text;
    contents.appendChild(summary);
    var card = document.getElementById('yearCard');
    card.style.display = 'block';
    card.scrollIntoView({behavior: 'smooth'});
  }

  function init() {
    ['vrow', 'grow', 'arow'].forEach(function (key) { document.getElementById(key).closest('.field').hidden = true; });
    document.querySelectorAll('#pupilRows .mini-scores').forEach(function (scores) {
      scores.closest('.pupil-field').hidden = true;
    });
    selectUnit('one');
    selectUnit('group');
    prefixes.forEach(function (prefix) {
      var name = document.getElementById(inputId(prefix, prefix === 'one' ? 'cname' : 'name'));
      name.addEventListener('input', function () { load(prefix); });
      var root = prefix === 'one' ? document.getElementById('tab-one') : document.querySelector('[data-pupil="' + prefix.slice(1) + '"]');
      root.addEventListener('input', function () { remember(prefix); });
      root.addEventListener('change', function () { remember(prefix); });
    });
    document.getElementById('gTestTotal').addEventListener('input', function () {
      localStorage.setItem('ss_assessment_max_' + currentTeacher + '||' + GS.ui, JSON.stringify(this.value));
      rememberMode('group');
    });
  }

  return {
    read: read, report: report, escape: escape, init: init, attOf: attOf,
    remember: remember, rememberMode: rememberMode, selectUnit: selectUnit,
    showSavedUnit: showSavedUnit, showYear: showYear, preserveLegacyScores: preserveLegacyScores
  };
})();
window.addEventListener('load', Assessment.init);
