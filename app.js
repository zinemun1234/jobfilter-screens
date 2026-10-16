/* ==========================================================================
 * JobFilter Stitch Screens — 공통 인터랙션 레이어 (app.js)
 * 정적 Stitch 내보내기 화면을 "실제로 움직이는" 프로토타입으로 만든다.
 * 각 S-0X.html의 기존 인라인 스크립트를 해치지 않고, 없는 기능만 보강한다.
 * ========================================================================== */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var FILE = (location.pathname.split('/').pop() || 'index.html').toUpperCase();
  var SELF = FILE.replace(/\.HTML$/, '');

  function safe(fn) { try { fn(); } catch (e) { console.warn('[app.js]', e); } }

  /* ============================== 공통 토스트 ============================== */
  function jfToast(msg) {
    try {
      if (typeof window.showToast === 'function' && $('#toast-message')) { window.showToast(msg); return; }
      if (typeof window.toast === 'function') { window.toast(msg); return; }
    } catch (e) { /* fallthrough */ }
    var t = $('#jf-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'jf-toast';
      t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translate(-50%,20px);' +
        'background:#14396b;color:#fff;padding:10px 18px;border-radius:10px;' +
        'font:500 13px/1.5 "Pretendard","Inter",sans-serif;' +
        'box-shadow:0 8px 24px rgba(0,35,77,.28);opacity:0;pointer-events:none;' +
        'transition:all .25s ease;z-index:99999;white-space:nowrap;max-width:90vw';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    requestAnimationFrame(function () { t.style.opacity = '1'; t.style.transform = 'translate(-50%,0)'; });
    clearTimeout(t._h);
    t._h = setTimeout(function () { t.style.opacity = '0'; t.style.transform = 'translate(-50%,20px)'; }, 2600);
  }
  window.jfToast = jfToast;

  /* ======================== 화면 간 이동 (data-path) ======================== */
  var ROUTES = {
    // 학생 셸
    'dashboard': 'S-01.html',
    'job-listings': 'S-02.html',
    'application-kanban': 'S-05.html',
    'cover-letter-coach': 'S-04.html',
    'mock-interview': 'S-09.html',
    // 기업 셸
    'job-postings': 'S-06.html',
    'applicant-management': 'S-06.html',
    'talent-pool': 'S-06.html',
    'corporate-profile': 'S-06.html',
    // 관리자 셸
    'admin-dashboard': 'S-07.html',
    'approvals': 'S-07.html',
    'keyword-dictionary': 'S-07.html',
    'bulk-upload-logs': 'S-07.html',
    'user-management': 'S-07.html',
    'student-portal': 'S-01.html',
    // 모바일 탭
    'home': 'S-08.html',
    'jobs': 'S-08.html',
    'applications': 'S-05.html',
    'resume-coaching': 'S-04.html',
    'my-profile': 'S-09.html'
  };

  function wireNav() {
    $$('a[data-path]').forEach(function (a) {
      var path = a.getAttribute('data-path');
      var target = ROUTES[path];
      if (!target) {
        a.addEventListener('click', function (e) {
          e.preventDefault();
          jfToast('이 화면은 MVP 데모 범위에 포함되지 않았습니다.');
        });
        return;
      }
      if (target.toUpperCase() === FILE) {
        a.setAttribute('href', target);
        a.addEventListener('click', function (e) {
          e.preventDefault();
          jfToast(a.hasAttribute('aria-current') ? '현재 화면입니다.' : '데모에서는 이 화면만 제공됩니다.');
        });
      } else {
        a.setAttribute('href', target);
      }
    });

    // 학생 사이드바에 '모의면접'(S-09) 진입점 추가
    if (/^S-0[1-5]$/.test(SELF)) {
      var nav = $('aside nav');
      var ref = nav && nav.querySelector('[data-path="profile-management"]');
      if (nav && ref && !nav.querySelector('[data-path="mock-interview"]')) {
        var a = ref.cloneNode(true);
        a.setAttribute('data-path', 'mock-interview');
        a.removeAttribute('aria-current');
        a.className = 'flex items-center gap-space-sm px-space-md py-space-sm rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors';
        var icon = a.querySelector('.material-symbols-outlined');
        if (icon) icon.textContent = 'record_voice_over';
        var label = a.querySelectorAll('span')[1];
        if (label) label.textContent = '모의면접';
        a.setAttribute('href', 'S-09.html');
        nav.appendChild(a);
      }
    }
  }

  /* ================== 공통: 텍스트 규칙 기반 클릭 위임 ================== */
  function wireGeneric() {
    document.addEventListener('click', function (e) {
      var el = e.target.closest('a, button');
      if (!el || el.dataset.jfBound || el.hasAttribute('onclick') || el.hasAttribute('data-path')) return;
      var txt = (el.textContent || '').replace(/\s+/g, ' ').trim();
      var isA = el.tagName === 'A';

      /* --- 화면 이동 규칙 --- */
      var navRules = [
        [/상세 ?보기|공고 보기|공고 상세/, 'S-03.html'],
        [/전체 ?보기|전체보기|공고 목록|공고 맞춤 탐색|채용 공고/, 'S-02.html'],
        [/지원서 작성|자소서|합격 포트폴리오/, 'S-04.html'],
        [/대시보드/, 'S-01.html'],
        [/지원 관리|지원 일정/, 'S-05.html'],
        [/모의면접/, 'S-09.html']
      ];
      // <a> 태그에만 화면이동 적용 (버튼의 "지원 관리 칸반에 등록" 같은 액션과 충돌 방지)
      // 단, 명시적 내비 표현(상세보기/전체보기/지원서 작성/공고 보기)은 버튼도 허용
      var btnNavSrc = ['상세 ?보기|공고 보기', '전체 ?보기|전체보기|공고 목록|공고 맞춤 탐색|채용 공고', '지원서 작성|자소서|합격 포트폴리오'];
      for (var i = 0; i < navRules.length; i++) {
        if (navRules[i][0].test(txt)) {
          if (isA || btnNavSrc.indexOf(navRules[i][0].source) !== -1) {
            e.preventDefault(); location.href = navRules[i][1]; return;
          }
        }
      }

      /* --- 공통 액션 규칙 --- */
      var iconEl = el.querySelector('.material-symbols-outlined, [data-icon]');
      var iconTxt = iconEl ? iconEl.textContent.trim() : '';
      var acted = true;
      if (/notifications/.test(iconTxt) || /알림/.test(txt)) {
        jfToast('새 알림: 마감 임박 공고 3건, 서류 결과 1건이 있습니다.');
      } else if (/^share$/.test(iconTxt) || /공유/.test(txt)) {
        try { navigator.clipboard.writeText(location.href); } catch (err) {}
        jfToast('링크가 클립보드에 복사되었습니다.');
      } else if (/PDF 내보내기/.test(txt)) {
        jfToast('인쇄 대화상자에서 "PDF로 저장"을 선택하세요.');
        setTimeout(function () { window.print(); }, 500);
      } else if (/공고 원문|원문 링크|원문 보기/.test(txt)) {
        jfToast('공고 원문 페이지로 이동합니다. (데모: 외부 링크 생략)');
      } else if (/빠른 지원|지원 트랙 등록|칸반에 등록/.test(txt)) {
        jfToast('지원 관리 칸반 [서류 준비] 단계에 등록했습니다.');
      } else if (/바로 편집/.test(txt)) {
        var ta = document.getElementById('cover-letter-input');
        if (ta) ta.focus();
      } else if (/필터 설정|알림 조건|조건 세부 설정|매칭 기준 변경/.test(txt)) {
        jfToast('세부 설정 패널은 데모 범위 외입니다.');
      } else if (/이력서 PDF 등록/.test(txt)) {
        var fi2 = document.createElement('input');
        fi2.type = 'file'; fi2.accept = '.pdf';
        fi2.onchange = function () {
          jfToast('"' + (fi2.files[0] ? fi2.files[0].name : '') + '" 등록 — 키워드가 자동 추출됩니다.');
        };
        fi2.click();
      } else if (/사유 확인/.test(txt)) {
        jfToast('반려 사유: CS 직무 연관 키워드 부족 — 요구 스킬 태그 보강 후 재심사 가능.');
      } else if (/재도전/.test(txt)) {
        jfToast('해당 문항을 다시 풀이 모드로 전환했습니다.');
      } else if (/추천 세트/.test(txt)) {
        jfToast('추천 문항 세트(빈출 상위 3문항)로 모의면접을 시작합니다.');
      } else if (/임시 ?저장|임시저장/.test(txt)) {
        jfToast('임시 저장했습니다.');
      } else if (/설정|고객지원/.test(txt)) {
        jfToast('설정/고객지원 화면은 데모 범위 외입니다.');
      } else {
        acted = false;
      }

      if (acted) { e.preventDefault(); return; }

      // 아무 기능 없는 href="#" 링크의 페이지 상단 점프 방지
      if (isA && (el.getAttribute('href') === '#' || el.getAttribute('href') === '')) {
        e.preventDefault();
        if (txt) jfToast('"' + txt.slice(0, 20) + '" — 데모 범위 외 항목입니다.');
        return;
      }
      // 핸들러 없는 버튼도 피드백 제공
      if (el.tagName === 'BUTTON' && txt) {
        var iconOnly = iconTxt || txt;
        if (/^\d+$/.test(txt)) {
          // 페이지 번호 → 활성 상태 토글
          var scope = el.parentElement;
          $$('button', scope).forEach(function (x) {
            if (/^\d+$/.test(x.textContent.trim())) x.classList.remove('bg-primary', 'text-on-primary', 'font-bold');
          });
          el.classList.add('bg-primary', 'text-on-primary', 'font-bold');
          jfToast('페이지 ' + txt + ' — 데모 데이터는 1페이지 분량입니다.');
        } else if (/^(chevron_left|chevron_right|first_page|last_page)$/.test(iconOnly)) {
          jfToast('페이지 이동 — 데모 데이터는 1페이지 분량입니다.');
        } else if (/^(tune|more_horiz)$/.test(iconOnly) || /filter_list/.test(iconOnly)) {
          jfToast('세부 필터/메뉴는 데모 범위 외입니다.');
        } else if (/^bookmark/.test(iconOnly)) {
          var on = iconEl.textContent.trim() !== 'bookmark';
          iconEl.textContent = on ? 'bookmark' : 'bookmark_border';
          iconEl.classList.toggle('text-amber-warning', on);
          jfToast(on ? '스크랩에 추가했습니다.' : '스크랩을 해제했습니다.');
        } else if (txt.length < 30 && !/^(close|add|drag_indicator|bookmark)/.test(txt)) {
          jfToast('"' + txt + '" — 데모에서는 생략된 보조 기능입니다.');
        }
      }
    });

    // 헤더 검색창 → Enter 시 공고 목록으로 이동 (S-01 등)
    if (SELF !== 'S-02') {
      $$('header input[type="text"]').forEach(function (inp) {
        if (/검색/.test(inp.placeholder || '')) {
          inp.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && inp.value.trim()) {
              location.href = 'S-02.html?q=' + encodeURIComponent(inp.value.trim());
            }
          });
        }
      });
    }
  }

  /* ============================ S-01 대시보드 ============================ */
  function initS01() {
    // 북마크 토글은 파일 내 인라인 스크립트가 담당 (중복 바인딩 방지)

    // '이력서·희망직무 업데이트' 등 동기화 버튼
    $$('button').forEach(function (b) {
      if (/업데이트|동기화/.test(b.textContent) && !b.dataset.jfBound && !b.hasAttribute('onclick')) {
        b.dataset.jfBound = '1';
        b.addEventListener('click', function () {
          jfToast('이력서·희망직무 기반 매칭 분석을 다시 실행했습니다.');
        });
      }
    });
  }

  /* ============================ S-02 공고 목록 ============================ */
  function initS02() {
    // 공고 카드 수집 (매칭 링 SVG + D-day 배지를 가진 group 카드)
    var cards = $$('main div.group').filter(function (c) {
      return /D-\d+|D-DAY/i.test(c.textContent) && c.querySelector('svg');
    });
    if (!cards.length) return;
    var list = cards[0].parentElement;

    cards.forEach(function (c, i) {
      c.dataset.idx = i;
      var m = c.textContent.match(/(\d{1,3})\s*%/);
      c.dataset.match = m ? m[1] : '0';
      var d = c.textContent.match(/D-(\d+)/i) || c.textContent.match(/D-DAY/i);
      c.dataset.dday = d ? (d[1] !== undefined ? d[1] : '0') : '999';
      // 카드 내 공고 제목 링크 → 상세
      var titleLink = c.querySelector('a.font-headline-md, a[class*="headline"]');
      if (titleLink) titleLink.setAttribute('href', 'S-03.html');
    });

    var state = { q: '', chips: [], page: 1, size: 0 };

    function visibleCards() {
      return cards.filter(function (c) { return !c.dataset.jfHide; });
    }

    // 실제 페이지네이션 적용
    function applyPage() {
      var vis = visibleCards();
      var size = state.size || vis.length || 1;
      var maxPage = Math.max(1, Math.ceil(vis.length / size));
      if (state.page > maxPage) state.page = maxPage;
      var from = (state.page - 1) * size, to = Math.min(vis.length, from + size);
      cards.forEach(function (c) { c.style.display = 'none'; });
      vis.slice(from, to).forEach(function (c) { c.style.display = ''; });
      // "148개 공고 중 1 - 7 표시 중" 텍스트 갱신
      $$('main span').forEach(function (s) {
        if (/^\d+$/.test(s.textContent.trim()) && s.parentElement && /건의 맞춤 공고/.test(s.parentElement.textContent)) {
          s.textContent = String(vis.length);
        }
        if (/\d+\s*-\s*\d+\s*표시 중/.test(s.textContent)) {
          s.innerHTML = s.innerHTML.replace(/\d+\s*-\s*\d+/, (vis.length ? from + 1 : 0) + ' - ' + to);
        }
      });
    }

    function applyFilters() {
      var q = (state.q || '').toLowerCase().replace(/\s+/g, '');
      var active = state.chips;
      cards.forEach(function (c) {
        var hay = c.textContent.toLowerCase().replace(/\s+/g, '');
        var ok = !q || hay.indexOf(q) !== -1;
        if (ok) {
          for (var i = 0; i < active.length; i++) {
            var needle = active[i].toLowerCase().replace(/\s+/g, '');
            // 카드 어디에도 없는 칩(예: 지역 조합 텍스트)은 필터링에서 제외
            var anyCard = cards.some(function (cc) {
              return cc.textContent.toLowerCase().replace(/\s+/g, '').indexOf(needle) !== -1;
            });
            if (anyCard && hay.indexOf(needle) === -1) { ok = false; break; }
          }
        }
        c.dataset.jfHide = ok ? '' : '1';
      });
      state.page = 1;
      applyPage();
      var visible = visibleCards().length;
      if (q || active.length) jfToast('검색 결과: ' + visible + '건의 공고');
    }

    // 검색창
    $$('input[type="text"], input:not([type])').forEach(function (inp) {
      if (!/검색/.test(inp.placeholder || '')) return;
      var urlQ = new URLSearchParams(location.search).get('q');
      if (urlQ && !inp.value) { inp.value = urlQ; state.q = urlQ; setTimeout(applyFilters, 100); }
      inp.addEventListener('input', function () { state.q = inp.value.trim(); applyFilters(); });
      inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') applyFilters(); });
      // '검색' 버튼
      var sBtn = $$('button').find(function (b) { return /^검색$/.test(b.textContent.trim()) && !b.dataset.jfBound; });
      if (sBtn) { sBtn.dataset.jfBound = '1'; sBtn.addEventListener('click', applyFilters); }
    });

    // 정렬 버튼 그룹 (매칭순/마감순/최신순/스크랩순)
    var sortBtns = $$('main button').filter(function (b) {
      return /^\s*(매칭순|마감순|최신순|스크랩순)\s*$/.test(b.textContent);
    });
    function doSort(mode) {
      var sorted = cards.slice().sort(function (a, b) {
        if (/마감/.test(mode)) return (+a.dataset.dday) - (+b.dataset.dday);
        if (/최신/.test(mode)) return (+a.dataset.idx) - (+b.dataset.idx);
        if (/스크랩/.test(mode)) {
          var sa = a.querySelector('.material-symbols-outlined').textContent.trim() === 'bookmark' ? 0 : 1;
          var sb = b.querySelector('.material-symbols-outlined').textContent.trim() === 'bookmark' ? 0 : 1;
          return sa - sb || (+b.dataset.match) - (+a.dataset.match);
        }
        return (+b.dataset.match) - (+a.dataset.match);
      });
      sorted.forEach(function (c) { list.appendChild(c); });
      state.page = 1;
      applyPage();
      jfToast('"' + mode + '" 기준으로 정렬했습니다.');
    }
    sortBtns.forEach(function (b) {
      b.dataset.jfBound = '1';
      b.addEventListener('click', function () {
        sortBtns.forEach(function (x) {
          x.classList.remove('bg-surface', 'text-primary', 'shadow-sm', 'font-bold');
          x.classList.add('text-slate-muted');
        });
        b.classList.add('bg-surface', 'text-primary', 'shadow-sm', 'font-bold');
        b.classList.remove('text-slate-muted');
        doSort(b.textContent.trim());
      });
    });
    // 셀렉트 형태인 경우도 대비
    $$('select').forEach(function (sel) {
      var hasMatch = Array.prototype.some.call(sel.options, function (o) { return /매칭/.test(o.text); });
      if (!hasMatch) return;
      sel.addEventListener('change', function () { doSort(sel.value); });
    });

    // 필터 칩 토글 (rounded-full 후보 칩들)
    $$('main button').forEach(function (b) {
      if (!/rounded-full/.test(b.className)) return;
      if (/더보기|초기화/.test(b.textContent)) return;
      b.dataset.jfBound = '1';
      b.addEventListener('click', function () {
        var label = b.textContent.trim();
        var active = b.classList.toggle('jf-chip-on');
        if (active) {
          b.classList.remove('text-slate-muted', 'bg-paper-bg');
          b.classList.add('bg-primary-container', 'text-on-primary', 'font-medium', 'shadow-sm');
          if (state.chips.indexOf(label) === -1) state.chips.push(label);
        } else {
          b.classList.remove('bg-primary-container', 'text-on-primary', 'font-medium', 'shadow-sm');
          b.classList.add('text-slate-muted');
          state.chips = state.chips.filter(function (x) { return x !== label; });
        }
        applyFilters();
      });
    });

    // "적용 필터" 칩의 X 제거
    $$('main span.material-symbols-outlined').forEach(function (s) {
      if (s.textContent.trim() !== 'close') return;
      var chip = s.closest('span[class*="rounded-full"]');
      if (!chip) return;
      s.parentElement.style.cursor = 'pointer';
      s.parentElement.addEventListener('click', function () {
        chip.remove();
        jfToast('필터를 해제했습니다.');
      });
    });

    // 필터 초기화
    $$('main button').forEach(function (b) {
      if (!/초기화/.test(b.textContent) || b.dataset.jfBound) return;
      b.dataset.jfBound = '1';
      b.addEventListener('click', function () {
        state.chips = [];
        $$('main button.jf-chip-on').forEach(function (x) {
          x.classList.remove('jf-chip-on', 'bg-primary-container', 'text-on-primary', 'font-medium', 'shadow-sm');
          x.classList.add('text-slate-muted');
        });
        cards.forEach(function (c) { c.style.display = ''; });
        jfToast('모든 필터를 초기화했습니다.');
      });
    });

    /* ---- 공고 비교 (최대 3개 → 비교표 모달) ---- */
    var compare = [];
    function cardInfo(c) {
      var title = c.querySelector('a[href="S-03.html"], a[class*="headline"]');
      var company = c.querySelector('.font-label-caps');
      var skills = $$('span', c).filter(function (s) {
        return /rounded(-full)?/.test(s.className) && s.textContent.trim().length < 20 && /[A-Za-z+#.]/.test(s.textContent);
      }).map(function (s) { return s.textContent.trim(); }).slice(0, 6);
      return {
        title: title ? title.textContent.trim() : '(공고)',
        company: company ? company.textContent.trim() : '',
        match: (c.dataset.match || '0') + '%',
        dday: 'D-' + (c.dataset.dday || '?'),
        skills: skills
      };
    }
    function renderTray() {
      var tray = $('#jf-compare-tray');
      if (!compare.length) { if (tray) tray.remove(); return; }
      if (!tray) {
        tray = document.createElement('div');
        tray.id = 'jf-compare-tray';
        tray.style.cssText = 'position:fixed;bottom:18px;left:50%;transform:translateX(-50%);' +
          'background:#14396b;color:#fff;border-radius:14px;padding:10px 14px;display:flex;' +
          'align-items:center;gap:10px;box-shadow:0 10px 30px rgba(0,35,77,.35);z-index:9998;' +
          'font:500 13px/1.4 Pretendard,sans-serif';
        document.body.appendChild(tray);
      }
      tray.innerHTML = '<span style="opacity:.8">비교함</span>' + compare.map(function (c, i) {
        var info = cardInfo(c);
        return '<span style="background:rgba(255,255,255,.12);border-radius:8px;padding:4px 8px;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' +
          (i + 1) + '. ' + info.company + '</span>';
      }).join('') +
      '<button id="jf-cmp-open" style="background:#1A6FE0;border-radius:8px;padding:5px 12px;font-weight:700">비교하기</button>' +
      '<button id="jf-cmp-clear" style="opacity:.7;padding:4px 6px">비우기</button>';
      $('#jf-cmp-open').addEventListener('click', openCompareModal);
      $('#jf-cmp-clear').addEventListener('click', function () {
        compare.forEach(function (c) { delete c.dataset.jfCmp; });
        compare = [];
        $$('main button.jf-cmp-on').forEach(function (b) {
          b.classList.remove('jf-cmp-on', 'bg-secondary', 'text-on-secondary');
          b.classList.add('bg-surface-container-high');
        });
        renderTray();
      });
    }
    function openCompareModal() {
      var old = $('#jf-cmp-modal');
      if (old) old.remove();
      var ov = document.createElement('div');
      ov.id = 'jf-cmp-modal';
      ov.style.cssText = 'position:fixed;inset:0;background:rgba(19,28,40,.5);z-index:9999;display:flex;align-items:center;justify-content:center;padding:24px';
      var infos = compare.map(cardInfo);
      var rows = [
        ['회사', function (i) { return i.company; }],
        ['포지션', function (i) { return i.title; }],
        ['매칭 점수', function (i) { return '<b style="color:#16A34A">' + i.match + '</b>'; }],
        ['마감', function (i) { return '<b style="color:#DC2626">' + i.dday + '</b>'; }],
        ['요구 스킬', function (i) { return i.skills.join(' · '); }]
      ];
      ov.innerHTML =
        '<div style="background:#fff;border-radius:14px;max-width:900px;width:100%;max-height:80vh;overflow:auto;padding:24px;font:400 13px/1.5 Pretendard,sans-serif">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">' +
        '<b style="font-size:16px;color:#14396b">공고 비교 (' + infos.length + '건)</b>' +
        '<button id="jf-cmp-close" style="color:#5B6472;font-size:20px;line-height:1">×</button></div>' +
        '<table style="width:100%;border-collapse:collapse">' +
        '<tr><th style="text-align:left;padding:8px;border-bottom:2px solid #E3E8EF;color:#5B6472;width:90px">항목</th>' +
        infos.map(function (i) { return '<th style="text-align:left;padding:8px;border-bottom:2px solid #E3E8EF;color:#14396b">' + i.company + '</th>'; }).join('') + '</tr>' +
        rows.map(function (r) {
          return '<tr><td style="padding:8px;border-bottom:1px solid #E3E8EF;color:#5B6472;font-weight:600">' + r[0] + '</td>' +
            infos.map(function (i) { return '<td style="padding:8px;border-bottom:1px solid #E3E8EF">' + r[1](i) + '</td>'; }).join('') + '</tr>';
        }).join('') + '</table></div>';
      document.body.appendChild(ov);
      ov.addEventListener('click', function (e) { if (e.target === ov) ov.remove(); });
      $('#jf-cmp-close').addEventListener('click', function () { ov.remove(); });
    }
    cards.forEach(function (c) {
      $$('button', c).forEach(function (b) {
        if (!/^\s*비교\s*$/.test(b.textContent) || b.dataset.jfBound) return;
        b.dataset.jfBound = '1';
        b.addEventListener('click', function () {
          var idx = compare.indexOf(c);
          if (idx !== -1) {
            compare.splice(idx, 1);
            b.classList.remove('jf-cmp-on', 'bg-secondary', 'text-on-secondary');
            b.classList.add('bg-surface-container-high');
          } else {
            if (compare.length >= 3) { jfToast('비교는 최대 3개까지 가능합니다.'); return; }
            compare.push(c);
            b.classList.add('jf-cmp-on', 'bg-secondary', 'text-on-secondary');
            b.classList.remove('bg-surface-container-high');
            jfToast('비교함에 추가했습니다. (' + compare.length + '/3)');
          }
          renderTray();
        });
      });
    });

    /* ---- 페이지네이션 + 페이지 크기 ---- */
    var pageArea = $$('main .material-symbols-outlined').filter(function (s) {
      return s.textContent.trim() === 'chevron_left';
    })[0];
    if (pageArea) {
      var pager = pageArea.closest('div');
      if (pager) {
        var numBtns = $$('button', pager).filter(function (b) { return /^\s*\d+\s*$/.test(b.textContent); });
        var prevB = $$('button', pager).filter(function (b) { var i = b.querySelector('.material-symbols-outlined'); return i && i.textContent.trim() === 'chevron_left'; })[0];
        var nextB = $$('button', pager).filter(function (b) { var i = b.querySelector('.material-symbols-outlined'); return i && i.textContent.trim() === 'chevron_right'; })[0];
        function paintPager() {
          numBtns.forEach(function (x) {
            var on = (+x.textContent.trim()) === state.page;
            x.classList.toggle('bg-primary-container', on);
            x.classList.toggle('text-on-primary', on);
            x.classList.toggle('text-slate-muted', !on);
          });
        }
        numBtns.forEach(function (b) {
          b.dataset.jfBound = '1';
          b.addEventListener('click', function () { state.page = +b.textContent.trim(); applyPage(); paintPager(); });
        });
        if (prevB) { prevB.dataset.jfBound = '1'; prevB.disabled = false; prevB.addEventListener('click', function () { if (state.page > 1) { state.page--; applyPage(); paintPager(); } }); }
        if (nextB) { nextB.dataset.jfBound = '1'; nextB.addEventListener('click', function () { state.page++; applyPage(); paintPager(); }); }
      }
    }
    // 페이지 크기 셀렉트 (7개씩/15개씩/30개씩)
    $$('select').forEach(function (sel) {
      var isSize = Array.prototype.some.call(sel.options, function (o) { return /개씩/.test(o.text); });
      if (!isSize) return;
      state.size = parseInt(sel.value, 10) || 7;
      sel.addEventListener('change', function () {
        state.size = parseInt(sel.value, 10) || 7;
        state.page = 1;
        applyPage();
        jfToast('페이지당 ' + state.size + '개씩 표시합니다.');
      });
    });
    applyPage();
  }

  /* ========================== S-04 자소서 코칭 ========================== */
  function initS04() {
    var ta = $('#cover-letter-input');
    if (!ta) return;

    /* ---- 문항 탭 전환 (내용 개별 보관) ---- */
    var store;
    try { store = JSON.parse(localStorage.getItem('jf_s04') || '{}'); } catch (e) { store = {}; }
    var tabBtns = $$('button').filter(function (b) { return /문항\s*\d+/.test(b.textContent); });
    var curTab = 0;
    store.tabs = store.tabs || {};
    if (store.tabs[0] === undefined) store.tabs[0] = ta.value;

    function persist() {
      store.tabs[curTab] = ta.value;
      try { localStorage.setItem('jf_s04', JSON.stringify(store)); } catch (e) {}
    }
    function setActiveTab(idx) {
      tabBtns.forEach(function (b, i) {
        var on = i === idx;
        b.classList.toggle('bg-surface', on);
        b.classList.toggle('shadow-sm', on);
        b.classList.toggle('text-primary', on);
        b.classList.toggle('font-semibold', on);
        if (!on) b.classList.add('text-slate-muted'); else b.classList.remove('text-slate-muted');
      });
    }
    tabBtns.forEach(function (b, i) {
      b.dataset.jfBound = '1';
      b.addEventListener('click', function () {
        persist();
        curTab = i;
        ta.value = store.tabs[i] || '';
        setActiveTab(i);
        updateCounters();
        jfToast('문항 ' + (i + 1) + '로 전환했습니다.');
      });
    });
    if (store.tabs[0] && store.tabs[0] !== ta.value) ta.value = store.tabs[0];

    // 새 문항 추가
    var addBtn = $('button[title="새 문항 추가"]');
    if (addBtn && tabBtns.length) {
      addBtn.dataset.jfBound = '1';
      addBtn.addEventListener('click', function () {
        var n = tabBtns.length + 1;
        var clone = tabBtns[tabBtns.length - 1].cloneNode(true);
        var spans = clone.querySelectorAll('span');
        clone.innerHTML = '';
        var s1 = document.createElement('span');
        s1.textContent = '문항 ' + n + ': 자유 문항';
        clone.appendChild(s1);
        clone.dataset.jfBound = '1';
        clone.className = tabBtns[tabBtns.length - 1].className;
        clone.addEventListener('click', function () {
          persist();
          curTab = tabBtns.indexOf(clone);
          ta.value = store.tabs[curTab] || '';
          setActiveTab(curTab);
          updateCounters();
        });
        tabBtns[tabBtns.length - 1].parentElement.insertBefore(clone, null);
        tabBtns.push(clone);
        store.tabs[tabBtns.length - 1] = store.tabs[tabBtns.length - 1] || '';
        jfToast('문항 ' + n + '을(를) 추가했습니다.');
      });
    }

    /* ---- 글자 수/문장 수 카운터 ---- */
    function updateCounters() {
      var v = ta.value;
      var len = v.length;
      var noSpace = v.replace(/\s/g, '').length;
      var sents = v.split(/[.!?다음。\n]+/).filter(function (s) { return s.trim().length > 2; }).length || (v.trim() ? 1 : 0);
      var avg = sents ? Math.round(noSpace / sents) : 0;

      $$('span').forEach(function (s) {
        var t = s.textContent.trim();
        if (t === '글자 수:') {
          var box = s.parentElement;
          var kids = $$('span', box);
          if (kids[1]) kids[1].textContent = len.toLocaleString() + '자';
          if (kids[2]) kids[2].textContent = '(공백 제외 ' + noSpace.toLocaleString() + '자)';
        }
        if (t === '문장 수:') {
          s.parentElement.innerHTML = '문장 수: <span class="font-mono-metric font-semibold">' +
            sents + '문장</span> (평균 ' + avg + '자 · ' + (avg >= 25 && avg <= 80 ? '양호' : '조정 권장') + ')';
        }
        if (/충족률 \d+%/.test(t)) {
          var pct = Math.min(130, Math.round(noSpace / 800 * 100));
          s.innerHTML = s.innerHTML.replace(/충족률 \d+%/, '충족률 ' + pct + '%');
        }
      });
    }
    ta.addEventListener('input', function () { updateCounters(); persist(); });

    /* ---- 키워드 히트맵 재계산 ---- */
    var chips = $$('span').filter(function (s) {
      return s.querySelector('.material-symbols-outlined') && /\(\d+회\)/.test(s.textContent);
    });
    function heatmap() {
      var hay = ta.value.toLowerCase().replace(/\s+/g, '');
      var matched = 0;
      chips.forEach(function (chip) {
        var raw = chip.textContent.replace(/done|close/g, '');
        var mm = raw.match(/^(.*?)\s*\(\d+회\)/);
        if (!mm) return;
        var kw = mm[1].trim();
        var needle = kw.toLowerCase().replace(/\s+/g, '');
        var cnt = needle ? hay.split(needle).length - 1 : 0;
        if (cnt > 0) matched++;
        var icon = chip.querySelector('.material-symbols-outlined');
        chip.innerHTML = '';
        var ic = document.createElement('span');
        ic.className = 'material-symbols-outlined text-xs' + (cnt ? '' : ' text-alert-red');
        ic.textContent = cnt ? 'done' : 'close';
        chip.appendChild(ic);
        chip.appendChild(document.createTextNode(' ' + kw + ' (' + cnt + '회)'));
        if (cnt) {
          chip.classList.add('bg-emerald-50', 'text-match-green', 'border-emerald-200');
          chip.classList.remove('bg-surface-bright', 'text-slate-muted', 'border-hairline-border', 'opacity-70');
        } else {
          chip.classList.remove('bg-emerald-50', 'text-match-green', 'border-emerald-200');
          chip.classList.add('bg-surface-bright', 'text-slate-muted', 'border-hairline-border', 'opacity-70');
        }
      });
      var summary = $$('span').filter(function (s) { return /매칭 키워드 \d+ \/ \d+/.test(s.textContent); })[0];
      if (summary) summary.textContent = '매칭 키워드 ' + matched + ' / ' + chips.length +
        ' (' + Math.round(matched / Math.max(1, chips.length) * 100) + '%)';
      return matched;
    }
    ta.addEventListener('input', function () { clearTimeout(ta._hm); ta._hm = setTimeout(heatmap, 400); });

    /* ---- 7개 가중치 코칭 분석 ---- */
    function analyze() {
      var v = ta.value;
      var noSpace = v.replace(/\s/g, '').length;
      var sents = v.split(/[.!?\n]+/).filter(function (s) { return s.trim().length > 2; });
      var nums = (v.match(/\d+(\.\d+)?\s*(%|ms|TPS|RPS|건|명|배|개|만원|억|초|분|시간)/g) || []).length;
      var starHits = ['상황', '문제', '목표', '행동', '결과', '성과', '해결', '개선', '배웠']
        .filter(function (w) { return v.indexOf(w) !== -1; }).length;
      var kwMatched = heatmap() || 0;
      var avgLen = sents.length ? noSpace / sents.length : 0;

      var scores = [
        Math.min(10, noSpace >= 800 ? 10 : noSpace >= 500 ? 8 : noSpace >= 200 ? 5 : noSpace > 0 ? 3 : 0),      // 분량 10
        Math.max(0, Math.min(15, sents.length >= 5 ? 14 : sents.length >= 3 ? 12 : noSpace > 0 ? 7 : 0)),          // 표현 15
        nums >= 3 ? 15 : nums === 2 ? 12 : nums === 1 ? 8 : (noSpace ? 4 : 0),                                     // 수치 15
        Math.min(25, noSpace ? 6 + starHits * 3 : 0),                                                              // STAR 25
        Math.min(20, Math.round(kwMatched / Math.max(1, chips.length) * 20)),                                      // 키워드 20
        avgLen === 0 ? 0 : (avgLen >= 25 && avgLen <= 80 ? 10 : avgLen <= 120 ? 7 : 4),                            // 문장길이 10
        /협업|팀|갈등|소통|동료|리뷰|멘토/.test(v) ? 5 : (noSpace ? 2 : 0)                                           // 협업 5
      ];
      var maxes = [10, 15, 15, 25, 20, 10, 5];
      var total = scores.reduce(function (a, b) { return a + b; }, 0);

      // 각 항목 점수 + 막대
      var scoreSpans = $$('span').filter(function (s) {
        return /^\s*\d+\s*\/\s*\d+점\s*$/.test(s.textContent);
      });
      scoreSpans.slice(0, 7).forEach(function (s, i) {
        var sc = scores[i], mx = maxes[i], pct = Math.round(sc / mx * 100);
        s.childNodes[0].nodeValue = String(sc);
        s.classList.remove('text-primary', 'text-amber-warning', 'text-alert-red');
        s.classList.add(pct >= 80 ? 'text-primary' : pct >= 50 ? 'text-amber-warning' : 'text-alert-red');
        var row = s.closest('div');
        var wrap = row && row.parentElement;
        var bar = wrap && wrap.querySelector('div[style*="width"]');
        if (bar) {
          bar.style.width = pct + '%';
          bar.classList.remove('bg-match-green', 'bg-amber-warning', 'bg-alert-red', 'bg-secondary', 'bg-primary');
          bar.classList.add(pct >= 80 ? 'bg-match-green' : pct >= 50 ? 'bg-amber-warning' : 'bg-alert-red');
        }
      });

      // 총점 숫자 + 도넛 링 + 상태 문구
      var label = $$('span').filter(function (s) { return /적합도 총점/.test(s.textContent); })[0];
      var box = label && label.parentElement;
      if (box) {
        var big = $$('span', box).filter(function (s) { return /^\s*\d{1,3}\s*$/.test(s.textContent); })[0];
        if (big) big.textContent = String(total);
      }
      var pctEl = $$('span').filter(function (s) { return /^\s*\d{1,3}%\s*$/.test(s.textContent); })[0];
      if (pctEl) pctEl.textContent = total + '%';
      var ring = $$('svg path[stroke-dasharray]').filter(function (p) {
        return /^\d+,\s*100$/.test(p.getAttribute('stroke-dasharray'));
      })[0];
      if (ring) ring.setAttribute('stroke-dasharray', total + ', 100');
      var status = $$('span').filter(function (s) { return /양호|보강 권장|부족/.test(s.textContent) && s.textContent.length < 30; })[0];
      if (status) status.textContent = total >= 80 ? '우수 · 제출 가능 수준' : total >= 60 ? '양호 · STAR 보강 권장' : '부족 · 보완 필요';
      jfToast('코칭 진단 완료: 총점 ' + total + '점');
    }

    // 버튼 연결
    $$('button').forEach(function (b) {
      var t = b.textContent.replace(/\s+/g, ' ').trim();
      if (b.dataset.jfBound) return;
      if (/코칭|진단|분석/.test(t)) {
        b.dataset.jfBound = '1';
        b.addEventListener('click', analyze);
      } else if (/저장/.test(t)) {
        b.dataset.jfBound = '1';
        b.addEventListener('click', function () { persist(); jfToast('임시 저장했습니다.'); });
      } else if (/키워드 추천/.test(t)) {
        b.dataset.jfBound = '1';
        b.addEventListener('click', function () { jfToast('미출현 키워드: MySQL, REST API, Elasticsearch 등을 자연스럽게 포함하세요.'); });
      }
    });

    /* ---- 에디터 툴바 (굵게/기울임/목록/코드블록/템플릿) ---- */
    function wrapSel(pre, post) {
      var s = ta.selectionStart, e = ta.selectionEnd;
      ta.value = ta.value.slice(0, s) + pre + ta.value.slice(s, e) + (post !== undefined ? post : pre) + ta.value.slice(e);
      ta.focus();
      ta.selectionStart = s + pre.length;
      ta.selectionEnd = e + pre.length;
      ta.dispatchEvent(new Event('input'));
    }
    var tb = {
      '굵게': function () { wrapSel('**'); },
      '기울임': function () { wrapSel('*'); },
      '코드 블록': function () { wrapSel('\n```\n', '\n```\n'); },
      '목록': function () {
        var s = ta.selectionStart;
        var lineStart = ta.value.lastIndexOf('\n', s - 1) + 1;
        ta.value = ta.value.slice(0, lineStart) + '- ' + ta.value.slice(lineStart);
        ta.focus(); ta.dispatchEvent(new Event('input'));
      },
      '프레임 삽입': function () { if (typeof window.insertFrame === 'function') window.insertFrame('A'); updateCounters(); }
    };
    Object.keys(tb).forEach(function (title) {
      var b = $('button[title="' + title + '"]');
      if (b && !b.dataset.jfBound) { b.dataset.jfBound = '1'; b.addEventListener('click', tb[title]); }
    });

    /* ---- 버전 이력 (localStorage 스냅샷 + 복원) ---- */
    store.versions = store.versions || [];
    var saveBtn = $$('button').filter(function (b) { return /임시 저장/.test(b.textContent); })[0];
    if (saveBtn) {
      var verSel = document.createElement('select');
      verSel.className = 'bg-paper-bg text-slate-muted text-xs rounded-lg px-2 py-1.5 focus:outline-none';
      verSel.innerHTML = '<option value="">버전 이력</option>';
      saveBtn.parentElement.insertBefore(verSel, saveBtn);
      function paintVersions() {
        verSel.innerHTML = '<option value="">버전 이력 (' + store.versions.length + ')</option>' +
          store.versions.map(function (v, i) {
            return '<option value="' + i + '">' + v.time + ' · 문항' + (v.tab + 1) + ' · ' + v.len + '자</option>';
          }).join('');
      }
      paintVersions();
      verSel.addEventListener('change', function () {
        var v = store.versions[+verSel.value];
        if (v) { ta.value = v.text; updateCounters(); heatmap(); jfToast(v.time + ' 버전을 불러왔습니다.'); }
        verSel.value = '';
      });
      saveBtn.addEventListener('click', function () {
        store.versions.unshift({
          time: new Date().toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
          tab: curTab, len: ta.value.replace(/\s/g, '').length, text: ta.value
        });
        store.versions = store.versions.slice(0, 10);
        try { localStorage.setItem('jf_s04', JSON.stringify(store)); } catch (e) {}
        paintVersions();
      });
    }

    /* ---- 상단 'history v2.4 (최신)' 버튼 → 실제 버전 드롭다운 ---- */
    var histBtn = $$('button').filter(function (b) {
      return /history/.test(b.textContent) || /v\d+\.\d+.*최신/.test(b.textContent);
    })[0];
    if (histBtn && !histBtn.dataset.jfBound) {
      histBtn.dataset.jfBound = '1';
      var panel = document.createElement('div');
      panel.className = 'absolute right-0 top-full mt-1 w-72 bg-surface border border-hairline-border rounded-lg shadow-lg z-50 hidden p-2 flex flex-col gap-1';
      histBtn.parentElement.style.position = 'relative';
      histBtn.parentElement.appendChild(panel);
      function paintHist() {
        var items = store.versions.map(function (v, i) {
          return '<button data-v="' + i + '" class="text-left px-2.5 py-1.5 rounded hover:bg-surface-container-high font-body-sm text-body-sm flex justify-between items-center">' +
            '<span>' + v.time + ' · 문항' + (v.tab + 1) + '</span><span class="font-mono-badge text-mono-badge text-slate-muted">' + v.len + '자</span></button>';
        }).join('');
        panel.innerHTML = '<div class="px-2.5 py-1 font-label-caps text-label-caps text-slate-muted border-b border-hairline-border">저장된 버전 (' + store.versions.length + ')</div>' +
          (items || '<div class="px-2.5 py-2 text-slate-muted font-body-sm text-body-sm">저장된 버전이 없습니다. [임시 저장]으로 생성하세요.</div>');
      }
      histBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        paintHist();
        panel.classList.toggle('hidden');
      });
      panel.addEventListener('click', function (e) {
        var vb = e.target.closest('button[data-v]');
        if (!vb) return;
        var v = store.versions[+vb.dataset.v];
        if (v) { ta.value = v.text; updateCounters(); heatmap(); jfToast(v.time + ' 버전을 불러왔습니다.'); }
        panel.classList.add('hidden');
      });
      document.addEventListener('click', function (e) {
        if (!panel.contains(e.target) && e.target !== histBtn && !histBtn.contains(e.target)) panel.classList.add('hidden');
      });
    }

    updateCounters();
    heatmap();
  }

  /* ========================== S-05 칸반 드래그 ========================== */
  function initS05() {
    var board = $('div[class*="min-w-["]') || $$('main > div').filter(function (d) {
      return /overflow-x/.test(d.className) || /min-w/.test(d.className);
    })[0];
    if (!board) return;
    var cols = Array.prototype.filter.call(board.children, function (c) {
      return c.className && c.className.indexOf('w-[280px]') !== -1;
    });
    if (!cols.length) cols = Array.prototype.slice.call(board.children);
    if (cols.length < 2) return;

    var dragCard = null;
    var lastCard = null;   // 마지막으로 클릭한 카드 (드로어 상태 변경 대상)

    function colCards(col) {
      return $$(':scope > div[onclick*="openDrawer"], :scope > div[data-jf-card]', col);
    }
    function colName(col) {
      var h = col.querySelector('h2, h3');
      return h ? h.textContent.trim() : '단계';
    }
    function updateCounts() {
      cols.forEach(function (col) {
        var badge = $$('span', col).filter(function (s) { return /^\d+$/.test(s.textContent.trim()); })[0];
        if (badge) badge.textContent = String(colCards(col).length);
      });
    }
    function makeDraggable(card) {
      if (card.dataset.jfDrag) return;
      card.dataset.jfDrag = '1';
      card.setAttribute('draggable', 'true');
      card.classList.add('cursor-grab');
      card.addEventListener('click', function () { lastCard = card; });
      card.addEventListener('dragstart', function (e) {
        dragCard = card;
        card.classList.add('opacity-40');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', 'card');
      });
      card.addEventListener('dragend', function () {
        card.classList.remove('opacity-40');
        cols.forEach(function (c) { c.classList.remove('ring-2', 'ring-secondary', 'bg-secondary-container/30'); });
      });
    }

    cols.forEach(function (col) {
      colCards(col).forEach(makeDraggable);
      col.addEventListener('dragover', function (e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        col.classList.add('ring-2', 'ring-secondary');
      });
      col.addEventListener('dragleave', function () {
        col.classList.remove('ring-2', 'ring-secondary');
      });
      col.addEventListener('drop', function (e) {
        e.preventDefault();
        col.classList.remove('ring-2', 'ring-secondary');
        if (!dragCard) return;
        // 카드들이 끝난 뒤(또는 빈 자리)에 삽입 — 단순히 컬럼 끝에 추가
        col.appendChild(dragCard);
        updateCounts();
        var name = (dragCard.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 24);
        jfToast('"' + name + '…" → [' + colName(col) + '] 단계로 이동했습니다.');
        dragCard = null;
      });
    });

    // 컬럼 상단 "+" 버튼 → 신규 등록 모달
    cols.forEach(function (col) {
      var plus = $$('button', col).filter(function (b) {
        var ic = b.querySelector('.material-symbols-outlined');
        return ic && ic.textContent.trim() === 'add';
      })[0];
      if (plus && !plus.dataset.jfBound) {
        plus.dataset.jfBound = '1';
        plus.addEventListener('click', function () {
          if (typeof window.openNewModal === 'function') window.openNewModal();
        });
      }
    });

    // 신규 등록 모달 submit → 선택한 컬럼에 카드 생성
    var modal = $('#newAppModal');
    var form = modal && modal.querySelector('form');
    if (form) {
      form.addEventListener('submit', function () {
        var inputs = $$('input', form);
        var company = inputs[0] ? inputs[0].value.trim() : '';
        var position = inputs[1] ? inputs[1].value.trim() : '';
        var sel = form.querySelector('select');
        var stage = sel ? sel.value.trim() : '서류 준비';
        var date = form.querySelector('input[type="date"]');
        var memo = inputs[inputs.length - 1] ? inputs[inputs.length - 1].value.trim() : '';
        var ddayTxt = 'D-?';
        if (date && date.value) {
          var diff = Math.ceil((new Date(date.value) - new Date()) / 864e5);
          ddayTxt = diff <= 0 ? 'D-DAY' : 'D-' + diff;
        }
        var target = cols.filter(function (c) {
          return colName(c).indexOf(stage.replace(' 진행', '')) !== -1;
        })[0] || cols[0];

        var card = document.createElement('div');
        card.className = 'group bg-surface rounded-lg p-space-md shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col gap-space-xs';
        card.setAttribute('data-jf-card', '1');
        card.setAttribute('onclick', "openDrawer('new-" + Date.now() + "')");
        card.innerHTML =
          '<div class="flex items-start justify-between">' +
          '<span class="px-2 py-0.5 rounded bg-info-blue/10 text-info-blue font-label-caps text-label-caps font-bold">' + ddayTxt + '</span>' +
          '<div class="flex items-center gap-1 text-slate-muted"><span class="material-symbols-outlined text-base">drag_indicator</span></div>' +
          '</div>' +
          '<div><div class="font-headline-sm text-body-md font-bold text-ink-charcoal group-hover:text-secondary transition-colors">' +
          (position || '신규 포지션') + '</div>' +
          '<div class="font-body-sm text-body-sm text-slate-muted">' + (company || '미지정 기업') + '</div></div>' +
          (memo ? '<div class="font-body-sm text-body-sm text-slate-muted truncate">📝 ' + memo.replace(/</g, '&lt;') + '</div>' : '');
        target.appendChild(card);
        makeDraggable(card);
        updateCounts();
        form.reset && form.reset();
        jfToast('[' + stage + '] 단계에 지원 카드를 추가했습니다.');
      });
    }

    // 신규 카드도 클릭 추적
    document.addEventListener('click', function (e) {
      var c = e.target.closest && e.target.closest('div[data-jf-card]');
      if (c) lastCard = c;
    });

    /* ---- 드로어 '현재 전형 상태 변경' 버튼 → 카드 실제 이동 ---- */
    var drawer = $('#detailDrawer');
    if (drawer) {
      var stageBtns = $$('button', drawer).filter(function (b) {
        return /서류 준비|지원 완료|서류 합격|면접|최종 합격|불합격/.test(b.textContent) && b.textContent.trim().length < 12;
      });
      stageBtns.forEach(function (b) {
        if (b.dataset.jfBound) return;
        b.dataset.jfBound = '1';
        b.addEventListener('click', function () {
          var stage = b.textContent.replace('✓', '').trim();
          // ✓ 표시 이동
          stageBtns.forEach(function (x) { x.innerHTML = x.innerHTML.replace(/\s*✓/, ''); });
          b.innerHTML = b.innerHTML.trim() + ' ✓';
          if (!lastCard) { jfToast('[' + stage + '] 상태로 변경되었습니다.'); return; }
          var target = cols.filter(function (c) {
            return colName(c).indexOf(stage.replace(' 진행', '')) !== -1;
          })[0];
          if (!target) { jfToast('해당 단계 컬럼이 없습니다.'); return; }
          if (lastCard.parentElement === target) { jfToast('이미 [' + stage + '] 단계입니다.'); return; }
          target.appendChild(lastCard);
          updateCounts();
          jfToast('칸반 카드가 [' + stage + '] 단계로 이동했습니다.');
        });
      });

      // 드로어 '지원 취소/삭제' → 카드 실제 제거
      var delBtn = $$('button', drawer).filter(function (b) { return /지원 취소|삭제/.test(b.textContent); })[0];
      if (delBtn && !delBtn.dataset.jfBound) {
        delBtn.dataset.jfBound = '1';
        delBtn.addEventListener('click', function () {
          if (lastCard && lastCard.parentElement) {
            var nm = (lastCard.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 20);
            lastCard.remove();
            lastCard = null;
            updateCounts();
            if (typeof window.closeDrawer === 'function') window.closeDrawer();
            jfToast('"' + nm + '…" 지원 카드를 삭제했습니다.');
          } else {
            jfToast('삭제할 카드를 먼저 선택하세요.');
          }
        });
      }
      // 드로어 '변경사항 저장' → 닫기 + 확인
      var saveD = $$('button', drawer).filter(function (b) { return /변경사항 저장/.test(b.textContent); })[0];
      if (saveD && !saveD.dataset.jfBound) {
        saveD.dataset.jfBound = '1';
        saveD.addEventListener('click', function () {
          if (typeof window.closeDrawer === 'function') window.closeDrawer();
          jfToast('변경사항을 저장했습니다.');
        });
      }
    }

    /* ---- 상단 '마감순 정렬' → 각 컬럼 내 카드 D-day 정렬 ---- */
    function cardDday(c) {
      var m = (c.textContent || '').match(/D-(\d+)/);
      return m ? +m[1] : 9999;
    }
    var sortBtn = $('#filterBtn') || $$('button').filter(function (b) { return /마감순 정렬/.test(b.textContent); })[0];
    if (sortBtn && !sortBtn.dataset.jfBound) {
      sortBtn.dataset.jfBound = '1';
      sortBtn.addEventListener('click', function () {
        cols.forEach(function (col) {
          colCards(col).slice().sort(function (a, b) { return cardDday(a) - cardDday(b); })
            .forEach(function (c) { col.appendChild(c); });
        });
        jfToast('각 단계 내에서 마감일이 임박한 순으로 정렬했습니다.');
      });
    }

    /* ---- '필터' 버튼 → 긴급(D-3 이하) 카드만 보기 토글 ---- */
    var filtBtn = $$('button').filter(function (b) { return /filter_list|필터$/.test(b.textContent.replace(/\s+/g,'')); })[0];
    var urgentOnly = false;
    if (filtBtn && !filtBtn.dataset.jfBound) {
      filtBtn.dataset.jfBound = '1';
      filtBtn.addEventListener('click', function () {
        urgentOnly = !urgentOnly;
        cols.forEach(function (col) {
          colCards(col).forEach(function (c) {
            c.style.display = (!urgentOnly || cardDday(c) <= 3) ? '' : 'none';
          });
        });
        filtBtn.classList.toggle('bg-secondary-container', urgentOnly);
        filtBtn.classList.toggle('text-on-primary', urgentOnly);
        jfToast(urgentOnly ? 'D-3 이하 마감 임박 카드만 표시합니다.' : '전체 카드를 다시 표시합니다.');
      });
    }
    updateCounts();
  }

  /* ======================== S-06 기업 공고 관리 ======================== */
  function initS06() {
    var tbody = $('tbody');
    var rowOf = function (chip) { return chip.closest('tr'); };
    function rowStatus(tr) {
      var chip = tr.children[4]; // 상태 칩 td
      var s = chip ? chip.textContent : tr.textContent;
      if (/게시 중/.test(s)) return '게시 중';
      if (/승인 대기/.test(s)) return '승인 대기';
      if (/반려/.test(s)) return '반려';
      if (/마감/.test(s)) return '마감';
      return '';
    }
    function statusChip(tr, status) {
      // 상태 칩 통째로 교체
      var chip = $$('span', tr).filter(function (s) {
        return /게시 중|승인 대기|반려|마감/.test(s.textContent) && s.textContent.trim().length < 8;
      })[0];
      if (!chip) return;
      var styles = {
        '게시 중': ['bg-emerald-50', 'text-match-green'],
        '승인 대기': ['bg-amber-50', 'text-amber-warning'],
        '반려': ['bg-red-50', 'text-alert-red'],
        '마감': ['bg-surface-container', 'text-slate-muted']
      };
      var dot = chip.querySelector('span');
      chip.innerHTML = '<span class="w-1.5 h-1.5 rounded-full" style="background:currentColor"></span><span>' + status + '</span>';
      chip.classList.remove('bg-emerald-50', 'text-match-green', 'bg-amber-50', 'text-amber-warning', 'bg-red-50', 'text-alert-red', 'bg-surface-container', 'text-slate-muted');
      (styles[status] || []).forEach(function (c) { chip.classList.add(c); });
    }
    function recountTabs() {
      var rows = tbody ? $$('tr', tbody) : [];
      var counts = { '전체': rows.length, '게시 중': 0, '승인 대기': 0, '반려': 0, '마감': 0 };
      rows.forEach(function (tr) { var s = rowStatus(tr); if (counts[s] !== undefined) counts[s]++; });
      $$('button').forEach(function (b) {
        var m = b.textContent.match(/^(전체|게시 중|승인 대기|반려|마감)\s*\(\d+\)/);
        if (m) b.textContent = m[1] + ' (' + (counts[m[1]] || 0) + ')';
      });
    }

    /* ---- 상태 탭 필터 + 검색 + 정렬 ---- */
    var tabBtns = $$('button').filter(function (b) {
      return /^(전체|게시 중|승인 대기|반려|마감)\s*\(\d+\)/.test(b.textContent.trim());
    });
    var tabState = '전체';
    function applyTable() {
      var q = (stateQ || '').toLowerCase();
      $$('tr', tbody).forEach(function (tr) {
        var ok = (tabState === '전체' || rowStatus(tr) === tabState) &&
                 (!q || tr.textContent.toLowerCase().indexOf(q) !== -1);
        tr.style.display = ok ? '' : 'none';
      });
    }
    var stateQ = '';
    tabBtns.forEach(function (b) {
      b.dataset.jfBound = '1';
      b.addEventListener('click', function () {
        tabState = b.textContent.replace(/\s*\(\d+\)/, '').trim();
        tabBtns.forEach(function (x) {
          x.classList.remove('bg-surface', 'text-primary', 'shadow-sm', 'font-semibold');
          x.classList.add('text-slate-muted');
        });
        b.classList.add('bg-surface', 'text-primary', 'shadow-sm', 'font-semibold');
        b.classList.remove('text-slate-muted');
        applyTable();
      });
    });
    $$('input[type="text"]').forEach(function (inp) {
      if (!/공고명|검색/.test(inp.placeholder || '') || inp.dataset.jfBound) return;
      if (!/공고명/.test(inp.placeholder)) return;
      inp.dataset.jfBound = '1';
      inp.addEventListener('input', function () { stateQ = inp.value.trim(); applyTable(); });
    });
    $$('select').forEach(function (sel) {
      if (!Array.prototype.some.call(sel.options, function (o) { return /마감 임박순/.test(o.text); })) return;
      sel.addEventListener('change', function () {
        var rows = $$('tr', tbody);
        if (/마감/.test(sel.value)) {
          rows.sort(function (a, b) {
            var da = (a.querySelector('td:nth-child(4) span') || {}).textContent || '9999';
            var db = (b.querySelector('td:nth-child(4) span') || {}).textContent || '9999';
            return da < db ? -1 : 1;
          });
        } else if (/지원자/.test(sel.value)) {
          rows.sort(function (a, b) {
            var na = parseInt((a.querySelector('td:nth-child(6)') || {}).textContent) || 0;
            var nb = parseInt((b.querySelector('td:nth-child(6)') || {}).textContent) || 0;
            return nb - na;
          });
        }
        rows.forEach(function (tr) { tbody.appendChild(tr); });
        jfToast('"' + sel.value + '" 정렬했습니다.');
      });
    });

    /* ---- 행 액션: 수정 / 지원자 보기 / 마감 ---- */
    $$('tbody button').forEach(function (b) {
      var t = b.textContent.trim();
      var tr = b.closest('tr');
      if (t === '마감' && !b.dataset.jfBound) {
        b.dataset.jfBound = '1';
        b.addEventListener('click', function () {
          statusChip(tr, '마감');
          tr.classList.add('opacity-60');
          recountTabs();
          jfToast('공고가 마감 처리되었습니다.');
        });
      } else if (t === '수정' && !b.dataset.jfBound) {
        b.dataset.jfBound = '1';
        b.addEventListener('click', function () {
          var m = $('#modal-single-posting');
          if (m) { m.dataset.editRow = '1'; m._row = tr; m.classList.remove('hidden'); jfToast('수정 모드로 열었습니다.'); }
        });
      } else if (/지원자 보기/.test(t) && !b.dataset.jfBound) {
        b.dataset.jfBound = '1';
        b.addEventListener('click', function () { jfToast('지원자 심사 화면은 데모 범위 외입니다.'); });
      }
    });

    /* ---- 엑셀 드롭존: CSV 실제 파싱 → 미리보기 ---- */
    // 드롭존: 가장 안쪽(하위 요소 수가 가장 적은) 매칭 div 선택 — 상위 섹션 클릭 전파 방지
    var dzMatches = $$('div').filter(function (d) { return /끌어다 놓거나 클릭하여 업로드/.test(d.textContent); });
    var dz = dzMatches.sort(function (a, b) { return a.querySelectorAll('*').length - b.querySelectorAll('*').length; })[0];
    var fi = document.createElement('input');
    fi.type = 'file'; fi.accept = '.xlsx,.csv'; fi.style.display = 'none';
    document.body.appendChild(fi);

    function parseCsv(text) {
      return text.split(/\r?\n/).filter(function (l) { return l.trim(); })
        .map(function (l) { return l.split(',').map(function (c) { return c.trim().replace(/^"|"$/g, ''); }); });
    }
    function renderPreview(rows, fname) {
      // 파일명 칩 갱신
      var nameEl = $$('span').filter(function (s) { return /\.xlsx|\.csv/.test(s.textContent); })[0];
      if (nameEl) nameEl.textContent = fname;
      var pt = $$('table tbody')[1] || $$('table tbody')[0];
      if (!pt) return;
      var CS = /java|spring|python|c\+\+|js|node|react|kafka|redis|sql|aws|docker|backend|백엔드|프론트|개발/i;
      pt.innerHTML = rows.slice(0, 12).map(function (r, i) {
        var pos = r[0] || '(제목 없음)';
        var skills = (r[2] || r[1] || '').split(/[|/·]/).filter(Boolean).slice(0, 4);
        var fit = CS.test(pos + ' ' + skills.join(' '));
        return '<tr class="border-b border-hairline-border">' +
          '<td class="py-2.5 px-3 font-mono-metric text-xs text-slate-muted">#' + (i + 1) + '</td>' +
          '<td class="py-2.5 px-3 font-body-sm text-ink-charcoal">' + pos.replace(/</g, '&lt;') + '</td>' +
          '<td class="py-2.5 px-3"><div class="flex flex-wrap gap-1">' +
            skills.map(function (s) { return '<span class="px-2 py-0.5 rounded bg-surface-container text-primary font-mono-badge text-mono-badge">' + s.replace(/</g, '&lt;') + '</span>'; }).join('') +
          '</div></td>' +
          '<td class="py-2.5 px-3"><span class="inline-flex items-center gap-1 ' + (fit ? 'text-match-green' : 'text-slate-muted') + ' text-xs">' +
            '<span class="material-symbols-outlined text-sm">' + (fit ? 'school' : 'remove') + '</span>' + (fit ? '전공 우대' : '전공 무관') + '</span></td>' +
          '<td class="py-2.5 px-3"><span class="px-2 py-0.5 rounded-full font-mono-badge text-mono-badge font-bold ' +
            (fit ? 'bg-emerald-50 text-match-green' : 'bg-red-50 text-alert-red') + '">' + (fit ? '등록' : '비관련 제외') + '</span></td>' +
          '<td class="py-2.5 px-3 text-xs text-slate-muted">' + (fit ? '자동 분류 통과' : 'CS 직무 무관 키워드') + '</td></tr>';
      }).join('');
      jfToast('"' + fname + '" 파싱 완료 — ' + rows.length + '행 분류 결과를 확인하세요.');
    }
    function handleFile(f) {
      if (!f) return;
      if (/\.csv$/i.test(f.name)) {
        var rd = new FileReader();
        rd.onload = function () { renderPreview(parseCsv(String(rd.result)).slice(1), f.name); };
        rd.readAsText(f, 'utf-8');
      } else {
        jfToast('데모에서는 .csv 파일을 실제 파싱합니다. (.xlsx는 샘플 미리보기 유지)');
      }
    }
    if (dz) {
      dz.style.cursor = 'pointer';
      dz.addEventListener('click', function () { fi.click(); });
      dz.addEventListener('dragover', function (e) { e.preventDefault(); dz.classList.add('ring-2', 'ring-secondary'); });
      dz.addEventListener('dragleave', function () { dz.classList.remove('ring-2', 'ring-secondary'); });
      dz.addEventListener('drop', function (e) {
        e.preventDefault();
        dz.classList.remove('ring-2', 'ring-secondary');
        handleFile(e.dataTransfer.files && e.dataTransfer.files[0]);
      });
    }
    fi.addEventListener('change', function () { handleFile(fi.files[0]); });

    /* ---- 일괄 등록 실행: 미리보기의 "등록" 행을 공고 테이블에 추가 ---- */
    $$('button').forEach(function (b) {
      var t = b.textContent.replace(/\s+/g, ' ').trim();
      if (b.dataset.jfBound || b.hasAttribute('onclick')) return;
      if (/일괄 등록 실행/.test(t)) {
        b.dataset.jfBound = '1';
        b.addEventListener('click', function () {
          var pt = $$('table tbody')[1] || $$('table tbody')[0];
          var okRows = pt ? $$('tr', pt).filter(function (r) { return />등록</.test(r.innerHTML) || /등록/.test(r.textContent) && !/제외/.test(r.textContent); }) : [];
          var added = 0;
          var template = tbody && tbody.querySelector('tr');
          okRows.forEach(function (r) {
            if (!template) return;
            var titleTd = r.children[1];
            var pos = titleTd ? titleTd.textContent.trim() : '일괄등록 공고';
            var clone = template.cloneNode(true);
            var t0 = clone.querySelectorAll('td')[0];
            var spans = t0.querySelectorAll('span');
            if (spans[1]) spans[1].textContent = pos;
            statusChip(clone, '승인 대기');
            tbody.insertBefore(clone, tbody.firstChild);
            added++;
          });
          recountTabs();
          jfToast(added ? added + '건의 공고가 [승인 대기]로 등록되었습니다.' : '등록 가능한 행이 없습니다.');
        });
      } else if (/다른 파일로 교체/.test(t)) {
        b.dataset.jfBound = '1';
        b.addEventListener('click', function () { fi.click(); });
      } else if (/재검토/.test(t)) {
        b.dataset.jfBound = '1';
        b.addEventListener('click', function () { jfToast('제외 항목 재검토는 관리자 콘솔(S-07)에서 처리됩니다.'); });
      } else if (/템플릿 다운로드/.test(t)) {
        b.dataset.jfBound = '1';
        b.addEventListener('click', function () {
          var csv = '포지션명,회사,스킬,마감일\n백엔드 개발자,예시기업,Java|Spring,2025-07-01';
          var a = document.createElement('a');
          a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
          a.download = 'jobfilter_upload_template.csv';
          a.click();
          jfToast('업로드 템플릿(.csv)을 다운로드했습니다.');
        });
      }
    });

    /* ---- 단건 등록 모달 제출 → 테이블에 행 추가 ---- */
    var modal = $('#modal-single-posting');
    if (modal) {
      $$('button', modal).forEach(function (b) {
        var t = b.textContent.replace(/\s+/g, ' ').trim();
        if (/등록|요청|저장|제출/.test(t) && !/취소|닫기/.test(t) && !b.dataset.jfBound) {
          b.dataset.jfBound = '1';
          b.addEventListener('click', function () {
            var inputs = $$('input[type="text"], input:not([type]), textarea', modal);
            var company = (inputs[0] && inputs[0].value.trim()) || '신규 기업';
            var position = (inputs[1] && inputs[1].value.trim()) || '신규 포지션';
            if (modal._row) {  // 수정 모드
              var s = modal._row.querySelectorAll('td')[0].querySelectorAll('span');
              if (s[1]) s[1].textContent = position;
              modal._row = null;
              modal.classList.add('hidden');
              jfToast('공고가 수정되었습니다.');
              return;
            }
            var template = tbody && tbody.querySelector('tr');
            if (template) {
              var clone = template.cloneNode(true);
              var td0 = clone.querySelectorAll('td')[0];
              var sps = td0.querySelectorAll('span');
              if (sps[1]) sps[1].textContent = position;
              if (sps[2]) sps[2].textContent = company + ' • 신규 등록';
              statusChip(clone, '승인 대기');
              tbody.insertBefore(clone, tbody.firstChild);
              recountTabs();
            }
            modal.classList.add('hidden');
            jfToast('공고가 등록되었습니다. 관리자 승인 후 게시됩니다.');
          });
        }
      });
    }

    /* ---- 반려/마감 행 액션: 검토요청 / 재등록 ---- */
    $$('button').forEach(function (b) {
      var t = b.textContent.replace(/\s+/g, ' ').trim();
      if (b.dataset.jfBound || b.hasAttribute('onclick')) return;
      if (/검토요청/.test(t)) {
        b.dataset.jfBound = '1';
        b.addEventListener('click', function () {
          var tr = b.closest('tr');
          if (tr && tbody && tbody.contains(tr)) {
            statusChip(tr, '승인 대기');
            recountTabs();
            jfToast('재심사 요청 — 공고가 [승인 대기] 상태로 변경되었습니다.');
          } else {
            jfToast('해당 공고를 재심사 대기열에 등록했습니다.');
          }
        });
      } else if (/재등록/.test(t)) {
        b.dataset.jfBound = '1';
        b.addEventListener('click', function () {
          var m = $('#modal-single-posting');
          if (m) m.classList.remove('hidden');
          jfToast('반려 사유를 반영해 내용을 수정한 뒤 다시 등록하세요.');
        });
      }
    });

    /* ---- 모달 에디터 툴바 (B / I / List / Code) + 스택 추가 ---- */
    if (modal) {
      var mta = modal.querySelector('textarea');
      var mWrap = function (pre, suf) {
        if (!mta) return;
        var s = mta.selectionStart || 0, en = mta.selectionEnd || 0;
        var sel = mta.value.slice(s, en) || '텍스트';
        mta.value = mta.value.slice(0, s) + pre + sel + suf + mta.value.slice(en);
        mta.focus();
        mta.selectionStart = s + pre.length; mta.selectionEnd = s + pre.length + sel.length;
      };
      $$('button', modal).forEach(function (b) {
        var t = b.textContent.trim();
        if (b.dataset.jfBound) return;
        if (t === 'B') { b.dataset.jfBound = '1'; b.addEventListener('click', function () { mWrap('**', '**'); }); }
        else if (t === 'I') { b.dataset.jfBound = '1'; b.addEventListener('click', function () { mWrap('*', '*'); }); }
        else if (t === 'List') { b.dataset.jfBound = '1'; b.addEventListener('click', function () { mWrap('\n- ', ''); }); }
        else if (t === 'Code') { b.dataset.jfBound = '1'; b.addEventListener('click', function () { mWrap('\n```\n', '\n```\n'); }); }
      });
      // 'add 스택 추가' → 칩 추가
      var addChip = $$('button', modal).filter(function (b) { return /스택 추가/.test(b.textContent); })[0];
      if (addChip && !addChip.dataset.jfBound) {
        addChip.dataset.jfBound = '1';
        var chipPool = ['Go', 'gRPC', 'Terraform', 'TypeScript', 'PostgreSQL', 'Kotlin'];
        var ci = 0;
        addChip.addEventListener('click', function () {
          var chip = document.createElement('span');
          chip.className = 'inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface border border-hairline-border text-primary font-mono-badge text-mono-badge font-semibold shadow-xs';
          chip.innerHTML = (chipPool[ci++ % chipPool.length]) + ' <button class="text-slate-muted hover:text-alert-red ml-0.5" type="button">×</button>';
          addChip.parentElement.insertBefore(chip, addChip);
          chip.querySelector('button').addEventListener('click', function () { chip.remove(); });
        });
      }
      // 스택 칩 × 버튼 → 칩 제거
      $$('button', modal).forEach(function (b) {
        if (b.textContent.trim() === '×' && !b.dataset.jfBound) {
          b.dataset.jfBound = '1';
          b.addEventListener('click', function () {
            var chip = b.closest('span');
            if (chip) chip.remove();
          });
        }
      });
    }

    /* ---- 페이지네이션 버튼 상태 토글 ---- */
    $$('button').forEach(function (b) {
      var t = b.textContent.trim();
      if (/^\d+$/.test(t) && !b.dataset.jfBound && !b.hasAttribute('onclick')) {
        b.dataset.jfBound = '1';
        b.addEventListener('click', function () {
          $$('button').forEach(function (x) {
            if (/^\d+$/.test(x.textContent.trim())) x.classList.remove('bg-primary', 'text-on-primary', 'font-bold');
          });
          b.classList.add('bg-primary', 'text-on-primary', 'font-bold');
        });
      }
    });
  }

  /* ========================== S-08 모바일 ========================== */
  function initS08() {
    var articles = $$('article');
    var listBox = articles.length ? articles[0].parentElement : null;

    function artMatch(a) {
      var m = (a.textContent || '').match(/(\d{1,3})%/);
      return m ? +m[1] : 0;
    }
    function artDday(a) {
      var m = (a.textContent || '').match(/D-(\d+)/);
      return m ? +m[1] : 9999;
    }
    function artScrapped(a) {
      var ic = a.querySelector('button .material-symbols-outlined');
      return ic && ic.textContent.trim() === 'star' &&
        (ic.style.fontVariationSettings || '').indexOf('1') !== -1;
    }
    function artCompany(a) {
      var h = a.querySelector('h3, .font-headline-sm');
      return h ? h.textContent.trim().slice(0, 14) : '공고';
    }

    /* ---- 카드 탭 → 공고 상세 ---- */
    articles.forEach(function (a) {
      a.addEventListener('click', function (e) {
        if (e.target.closest('button, a')) return;
        location.href = 'S-03.html';
      });
      a.style.cursor = 'pointer';
    });

    /* ---- 검색창 실시간 필터 ---- */
    var searchInp = $$('input[type="search"], input[type="text"]').filter(function (i) {
      return /검색/.test(i.placeholder || '');
    })[0];
    var scrapBtn = $$('button').filter(function (b) { return /스크랩\s*\(\d+\)/.test(b.textContent); })[0];
    var scrapOnly = false;
    function applyMobile() {
      var q = searchInp ? searchInp.value.trim().toLowerCase() : '';
      var n = 0;
      articles.forEach(function (a) {
        var ok = (!q || a.textContent.toLowerCase().indexOf(q) !== -1) && (!scrapOnly || artScrapped(a));
        a.style.display = ok ? '' : 'none';
        if (ok) n++;
      });
      var cnt = $$('main span').filter(function (s) { return /^총 \d+건$/.test(s.textContent.trim()); })[0];
      if (cnt) cnt.textContent = '총 ' + n + '건';
      return n;
    }
    if (searchInp) {
      searchInp.addEventListener('input', applyMobile);
      // 입력창 X 버튼 → 초기화
      var clearBtn = searchInp.parentElement.querySelector('button');
      if (clearBtn && !clearBtn.dataset.jfBound) {
        clearBtn.dataset.jfBound = '1';
        clearBtn.addEventListener('click', function () {
          searchInp.value = '';
          applyMobile();
          searchInp.focus();
        });
      }
    }

    /* ---- 스크랩(N) 버튼 → 스크랩만 보기 토글 ---- */
    if (scrapBtn && !scrapBtn.dataset.jfBound) {
      scrapBtn.dataset.jfBound = '1';
      scrapBtn.addEventListener('click', function () {
        scrapOnly = !scrapOnly;
        scrapBtn.classList.toggle('ring-2', scrapOnly);
        scrapBtn.classList.toggle('ring-amber-warning', scrapOnly);
        var n = applyMobile();
        jfToast(scrapOnly ? '스크랩한 공고 ' + n + '건만 표시합니다.' : '전체 공고를 표시합니다.');
      });
    }

    /* ---- 스크랩 별 토글(카드 내) ---- */
    articles.forEach(function (a) {
      var star = a.querySelector('button .material-symbols-outlined');
      var sb = star && star.textContent.trim() === 'star' ? star.closest('button') : null;
      if (sb && !sb.dataset.jfBound) {
        sb.dataset.jfBound = '1';
        sb.addEventListener('click', function (e) {
          e.stopPropagation();
          var on = star.style.fontVariationSettings.indexOf('1') === -1;
          star.style.fontVariationSettings = on ? "'FILL' 1" : "'FILL' 0";
          star.classList.toggle('text-amber-warning', on);
          star.classList.toggle('text-slate-muted', !on);
          jfToast(on ? '"' + artCompany(a) + '" 스크랩에 추가했습니다.' : '스크랩을 해제했습니다.');
        });
      }
    });

    /* ---- 필터 칩 토글 (신입/인턴·백엔드/서버·수도권) ---- */
    $$('main button').forEach(function (b) {
      var t = b.textContent.replace(/\s+/g, ' ').trim();
      if (b.dataset.jfBound || !/check/.test(t) && !/신입|백엔드|수도권|인턴/.test(t)) return;
      if (!/rounded-full/.test(b.className)) return;
      if (/필터 설정|매칭순|마감일순/.test(t)) return;
      b.dataset.jfBound = '1';
      b.addEventListener('click', function () {
        var on = b.classList.toggle('jf-chip-off');
        b.classList.toggle('opacity-40', on);
        b.classList.toggle('line-through', on);
        var chk = b.querySelector('.material-symbols-outlined');
        if (chk) chk.textContent = on ? 'close' : 'check';
        jfToast('"' + t.replace(/\s*(check|close)\s*$/, '') + '" 필터를 ' + (on ? '해제' : '적용') + '했습니다.');
      });
    });

    /* ---- 매칭순 / 마감일순 정렬 ---- */
    $$('main button').forEach(function (b) {
      var t = b.textContent.replace(/\s+/g, ' ').trim();
      if (b.dataset.jfBound) return;
      if (/매칭순|마감일순/.test(t) && /rounded-full/.test(b.className)) {
        b.dataset.jfBound = '1';
        b.addEventListener('click', function () {
          if (!listBox) return;
          articles.slice().sort(function (x, y) {
            return /마감/.test(t) ? artDday(x) - artDday(y) : artMatch(y) - artMatch(x);
          }).forEach(function (a) { listBox.appendChild(a); });
          jfToast('"' + t.replace(/●|expand_more|\s/g, '') + '" 기준으로 정렬했습니다.');
        });
      }
    });

    /* ---- '공고 N개 더 불러오기' → 기존 카드 복제 추가 ---- */
    var moreBtn = $$('button').filter(function (b) { return /더 불러오기/.test(b.textContent); })[0];
    if (moreBtn && !moreBtn.dataset.jfBound) {
      moreBtn.dataset.jfBound = '1';
      var moreClicks = 0;
      moreBtn.addEventListener('click', function () {
        if (moreClicks >= 2 || !articles.length) {
          moreBtn.innerHTML = '<span class="material-symbols-outlined text-[16px]">check</span><span>모든 공고를 불러왔습니다</span>';
          moreBtn.disabled = true;
          return;
        }
        moreClicks++;
        var added = 0;
        articles.slice(0, 3).forEach(function (a) {
          var c = a.cloneNode(true);
          listBox.appendChild(c);
          articles.push(c);
          added++;
        });
        jfToast('추천 공고 ' + added + '건을 더 불러왔습니다.');
        if (moreClicks >= 2) moreBtn.click();
      });
    }
  }

  /* ========================= S-09 모의면접 ========================== */
  function initS09() {
    // 카운트다운 타이머
    var timeEl = $$('span').filter(function (s) { return /^\s*\d{2}:\d{2}\s*$/.test(s.textContent); })[0];
    var totalEl = $$('span').filter(function (s) { return /^\s*\/\s*\d{2}:\d{2}\s*$/.test(s.textContent); })[0];
    var ring = $$('svg path[stroke-dasharray]').filter(function (p) {
      return /^\d+,\s*100$/.test(p.getAttribute('stroke-dasharray'));
    })[0];
    var totalSec = 90, remain = 74, timerId = null, running = true;

    function parseTotal() {
      if (totalEl) {
        var m = totalEl.textContent.match(/(\d{2}):(\d{2})/);
        if (m) totalSec = (+m[1]) * 60 + (+m[2]);
      }
    }
    function fmt(s) {
      return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
    }
    function paint() {
      if (timeEl) timeEl.textContent = fmt(remain);
      if (ring) ring.setAttribute('stroke-dasharray', Math.max(0, Math.round(remain / totalSec * 100)) + ', 100');
    }
    function tick() {
      if (!running) return;
      if (remain <= 0) { stop(); jfToast('제한 시간이 종료되었습니다.'); return; }
      remain--; paint();
    }

    /* ---- 문항 풀 + 실제 교체 ---- */
    var Q_POOL = [
      '대용량 트래픽 환경에서 RDBMS와 NoSQL을 선정한 기준과, 인덱스(B-Tree) 설계 시 겪었던 슬로우 쿼리 트러블슈팅 경험을 설명해주세요.',
      'REST API와 gRPC의 차이를 설명하고, 마이크로서비스 환경에서 각각을 어떻게 선택할지 본인의 프로젝트 경험과 함께 답변해주세요.',
      '동시성 이슈(레이스 컨디션)를 겪은 경험이 있다면, 원인 분석부터 해결(락, 낙관적 동시성 제어 등)까지의 과정을 설명해주세요.',
      '캐시(Cache) 도입으로 성능을 개선한 경험을 설명하고, 캐시 무효화(Invalidation) 전략을 어떻게 설계했는지 답변해주세요.',
      '코드 리뷰나 협업에서 기술적 의견 충돌이 있었던 사례와, 이를 해결한 방식을 구체적으로 설명해주세요.'
    ];
    var qIdx = 0;
    var qHeadline = $$('h2').filter(function (h) { return /설명해주세요|답변해주세요/.test(h.textContent); })[0];
    var qBadge = $$('span,button').filter(function (s) { return /\[\s*Q-?\d+\s*\]/.test(s.textContent.trim()); })[0];
    function swapQuestion(random) {
      if (!qHeadline) return;
      if (random) qIdx = Math.floor(Math.random() * Q_POOL.length);
      qHeadline.textContent = '"' + Q_POOL[qIdx % Q_POOL.length] + '"';
      if (qBadge) qBadge.innerHTML = qBadge.innerHTML.replace(/Q-?\d+/, 'Q-' + ((qIdx % Q_POOL.length) + 1));
      jfToast('문항을 교체했습니다. (DB-' + ((qIdx % Q_POOL.length) + 1).toString().padStart(2, '0') + ')');
    }

    /* ---- 답변 글자수 실시간 카운터 ---- */
    var ans = $('#answer-input') || $('#interview-answer');
    if (ans) {
      ans.addEventListener('input', function () {
        var len = ans.value.replace(/\s/g, '').length;
        var numEl = $('#char-count') || $$('span').filter(function (s) { return /^\s*\d+자?\s*$/.test(s.textContent); })[0];
        if (numEl) numEl.textContent = String(len);
        var verdict = $$('span').filter(function (s) { return /적정 분량|분량 부족|분량 초과/.test(s.textContent) && s.textContent.trim().length < 12; })[0];
        if (verdict) {
          var ok = len >= 300 && len <= 500;
          verdict.textContent = len < 300 ? '분량 부족' : ok ? '적정 분량 충족됨' : '분량 초과';
          var wrap = verdict.closest('div');
          if (wrap) {
            wrap.classList.toggle('text-match-green', ok);
            wrap.classList.toggle('text-amber-warning', !ok);
          }
        }
      });
      ans.dispatchEvent(new Event('input'));
    }
    function start() { if (!timerId) timerId = setInterval(tick, 1000); running = true; }
    function stop() { running = false; }
    parseTotal(); start();

    $$('button').forEach(function (b) {
      var t = (b.getAttribute('title') || '') + ' ' + b.textContent.replace(/\s+/g, ' ').trim();
      if (b.dataset.jfBound) return;
      if (/일시정지/.test(t)) {
        b.dataset.jfBound = '1';
        b.addEventListener('click', function () {
          running = !running;
          var ic = b.querySelector('.material-symbols-outlined, [data-icon]');
          if (ic) ic.textContent = running ? 'pause' : 'play_arrow';
          jfToast(running ? '면접을 재개합니다.' : '일시정지했습니다.');
        });
      } else if (/시간 리셋|리셋/.test(t)) {
        b.dataset.jfBound = '1';
        b.addEventListener('click', function () { remain = totalSec; paint(); jfToast('타이머를 리셋했습니다.'); });
      } else if (/재시작/.test(t)) {
        b.dataset.jfBound = '1';
        b.addEventListener('click', function () {
          remain = totalSec; running = true; start(); paint();
          $$('input[type="checkbox"]').forEach(function (c) { c.checked = false; });
          jfToast('모의면접을 처음부터 다시 시작합니다.');
        });
      } else if (/랜덤 문항 교체/.test(t)) {
        b.dataset.jfBound = '1';
        b.addEventListener('click', function () { swapQuestion(true); });
      } else if (/다음 문항/.test(t)) {
        b.dataset.jfBound = '1';
        b.addEventListener('click', function () {
          var prog = $$('span').filter(function (s) { return /문항\s*\d+\s*\/\s*\d+/.test(s.textContent); })[0];
          if (prog) {
            var m = prog.textContent.match(/문항\s*(\d+)\s*\/\s*(\d+)/);
            var cur = +m[1], max = +m[2];
            if (cur < max) {
              prog.textContent = prog.textContent.replace(/문항\s*\d+\s*\/\s*\d+/, '문항 ' + (cur + 1) + ' / ' + max);
              qIdx++;
              swapQuestion(false);
              remain = totalSec; paint();
              if (ans) { ans.value = ''; ans.dispatchEvent(new Event('input')); }
              jfToast('답변이 저장되었습니다. 문항 ' + (cur + 1) + '로 이동합니다.');
            } else {
              jfToast('모든 문항을 완료했습니다. 결과가 아래 기록에 반영됩니다.');
            }
          }
        });
      } else if (/음성 녹음/.test(t)) {
        b.dataset.jfBound = '1';
        b.addEventListener('click', function () { jfToast('브라우저 STT 녹음은 데모에서 비활성화되어 있습니다.'); });
      } else if (/CSV 내보내기/.test(t)) {
        b.dataset.jfBound = '1';
        b.addEventListener('click', function () {
          var rows = $$('table tr').map(function (tr) {
            return $$('th,td', tr).map(function (c) {
              return '"' + c.textContent.replace(/\s+/g, ' ').trim().replace(/"/g, '""') + '"';
            }).join(',');
          }).join('\r\n');
          if (!rows) { jfToast('내보낼 기록이 없습니다.'); return; }
          var blob = new Blob(['﻿' + rows], { type: 'text/csv;charset=utf-8' });
          var a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = 'mock_interview_log.csv';
          a.click();
          jfToast('면접 기록을 CSV로 내보냈습니다.');
        });
      }
    });

    /* ---- 직군 칩 토글 ---- */
    var chips = $$('#track-selector button');
    if (!chips.length) {
      chips = $$('main button').filter(function (b) {
        return /^(check\s*)?(백엔드|프론트엔드|인프라.?DevOps|데이터.?AI|보안|공통.?인성)/.test(b.textContent.replace(/\s+/g, ' ').trim());
      });
    }
    chips.forEach(function (b) {
      if (b.dataset.jfBound) return;
      b.dataset.jfBound = '1';
      b.addEventListener('click', function () {
        var on = !b.classList.contains('bg-primary-container');
        b.classList.toggle('bg-primary-container', on);
        b.classList.toggle('text-on-primary', on);
        b.classList.toggle('shadow-sm', on);
        b.classList.toggle('text-ink-charcoal', !on);
        b.classList.toggle('bg-surface-container-high', !on);
        var chk = b.querySelector('.material-symbols-outlined, [data-icon]');
        if (on && !chk) {
          chk = document.createElement('span');
          chk.className = 'material-symbols-outlined text-[16px]';
          b.prepend(chk);
        }
        if (chk) { chk.style.display = on ? '' : 'none'; chk.textContent = 'check'; }
        jfToast('"' + b.textContent.replace(/\s+/g, ' ').replace(/check|add/g, '').trim() + '" 직군 문항 풀 ' + (on ? '포함' : '제외'));
      });
    });

    /* ---- 하단 '재도전' 행 → 타이머 리셋 + 토스트 ---- */
    // (공통 규칙에서 토스트 처리됨 — 여기선 타이머도 리셋)
    $$('button').forEach(function (b) {
      if (!/^재도전$/.test(b.textContent.replace(/\s+/g, ' ').trim()) || b.dataset.jfBound) return;
      b.dataset.jfBound = '1';
      b.addEventListener('click', function (e) {
        e.stopImmediatePropagation();
        remain = totalSec; running = true; start(); paint();
        jfToast('해당 문항 재도전 — 타이머를 리셋했습니다.');
      });
    });

    // 상단 링크 → 다른 화면
    $$('a').forEach(function (a) {
      var t = a.textContent.replace(/\s+/g, ' ').trim();
      if (/지원 일정/.test(t)) a.setAttribute('href', 'S-05.html');
      else if (/채용 공고|공고/.test(t)) a.setAttribute('href', 'S-02.html');
      else if (/포트폴리오|자소서/.test(t)) a.setAttribute('href', 'S-04.html');
    });
  }

  /* ============================== 부팅 ============================== */
  function boot() {
    safe(wireNav);
    safe(wireGeneric);
    if (SELF === 'S-01') safe(initS01);
    if (SELF === 'S-02') safe(initS02);
    if (SELF === 'S-04') safe(initS04);
    if (SELF === 'S-05') safe(initS05);
    if (SELF === 'S-06') safe(initS06);
    if (SELF === 'S-08') safe(initS08);
    if (SELF === 'S-09') safe(initS09);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
