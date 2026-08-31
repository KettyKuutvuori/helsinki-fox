const STORAGE_KEY = 'helsinki-fox-operation-state-v1';
const APP_STORAGE_KEYS = [STORAGE_KEY];

const missionDefinitions = [
  {
    code: '01',
    label: 'ASSEMBLY POINT',
    type: 'MISSION BRIEFING',
    realLocation: 'OODI',
    title: 'Mission Briefing',
    objective: 'Find the wooden fortress opposite Parliament. Assemble the squad at the target.',
    clue: 'A quiet infiltration route is still live. The squad should regroup at the wooden fortress opposite Parliament.',
    brief: 'Quiet infiltration route acquired. Link established. Family squad must regroup before the Helsinki drift begins.',
    operator: 'command',
    icon: 'C',
    choices: ['OODI', 'KIASMA', 'CENTRAL STATION'],
    correctChoice: 'OODI'
  },
  {
    code: '02',
    label: 'WOODEN FORTRESS',
    type: 'RECON POINT',
    realLocation: 'OODI',
    title: 'Recon Point',
    objective: 'Take one stealth-style family photo and hide behind something completely inadequate.',
    clue: 'The team is already at the confirmed location. Keep the pace low and the family photos stealthy.',
    brief: 'Photo evidence required. Cover is optional but highly questionable. Maintain low profile and preserve snacks.',
    operator: 'snake',
    icon: 'S'
  },
  {
    code: '03',
    label: 'ART SECTOR',
    type: 'CLASSIFIED',
    realLocation: 'KIASMA',
    title: 'Art Sector',
    objective: 'Visit the angular contemporary-art structure near Mannerheimintie and identify a detail that looks like secret future-tech.',
    clue: 'Proceed to the angular contemporary-art structure near Mannerheimintie.',
    brief: 'Visual recon: exterior geometry, glass, and impossible angles. Any futuristic detail counts if it looks suspicious.',
    operator: 'command',
    icon: 'C',
    choices: ['KIASMA', 'OODI', 'AMOS REX'],
    correctChoice: 'KIASMA'
  },
  {
    code: '04',
    label: 'GREEN CORRIDOR',
    type: 'RATION ACQUISITION',
    realLocation: 'ESPLANADI',
    title: 'Ration Acquisition',
    objective: 'Acquire coffee, a sweet ration, and a Mini Fox ration. Stamina must be restored before the next sector.',
    clue: 'Proceed east toward the long green corridor used by civilians for recreation.',
    brief: 'Ration check is mandatory. Positive energy required for family stealth performance.',
    operator: 'mini-fox',
    icon: 'M',
    choices: ['ESPLANADI', 'KAIVOPUISTO', 'SENATE SQUARE'],
    correctChoice: 'ESPLANADI'
  },
  {
    code: '05',
    label: 'HARBOUR SECTOR',
    type: 'ENEMY TERRITORY',
    realLocation: 'MARKET SQUARE',
    title: 'Enemy Territory',
    objective: 'Photograph a seagull and protect Mini Fox\'s snacks.',
    clue: 'Continue toward the Baltic until you reach the square patrolled by hostile aerial units.',
    brief: 'Enemy awareness high. Seagulls may be hostile. The snack cache remains under guard at all times.',
    operator: 'snake',
    icon: 'S',
    choices: ['MARKET SQUARE', 'SENATE SQUARE', 'RAILWAY SQUARE'],
    correctChoice: 'MARKET SQUARE'
  },
  {
    code: '06',
    label: 'EXTRACTION',
    type: 'CLASSIFIED',
    realLocation: 'SAFEHOUSE',
    title: 'Final Extraction',
    objective: 'Show Snake, Command and Mini Fox as ACTIVE. Finish with mission complete and final rank: FAMILY S.',
    brief: 'The squad has reached extraction. Secure family S-rank status and withdraw to safe house.',
    operator: 'team',
    icon: 'T'
  }
];

const defaultState = {
  currentMission: 0,
  missionStates: ['active', 'locked', 'locked', 'locked', 'locked', 'locked'],
  rations: {
    coffee: false,
    sweet: false,
    miniFox: false
  },
  log: [
    'SIGNAL: OPERATION HELSINKI FOX ONLINE.',
    'LINK ACTIVE. FAMILY SQUAD READY.'
  ],
  missionComplete: false,
  intelMessage: ''
};

const missionListEl = document.querySelector('#missionList');
const missionListOverlayEl = document.querySelector('#missionListOverlay');
const missionContentEl = document.querySelector('#missionContent');
const missionActionBtn = document.querySelector('#missionActionBtn');
const resetBtn = document.querySelector('#resetBtn');
const missionLogToggle = document.querySelector('#missionLogToggle');
const missionLogOverlay = document.querySelector('#missionLogOverlay');
const missionLogClose = document.querySelector('#missionLogClose');
const missionCounterEl = document.querySelector('#missionCounter');
const missionIndexLabelEl = document.querySelector('#missionIndexLabel');
const missionActiveLabelEl = document.querySelector('#missionActiveLabel');
const resetDialog = document.querySelector('#resetDialog');
const resetCancelBtn = document.querySelector('#resetCancelBtn');
const resetConfirmBtn = document.querySelector('#resetConfirmBtn');

let state = loadState();

function createInitialState() {
  return {
    ...defaultState,
    missionStates: [...defaultState.missionStates],
    rations: { ...defaultState.rations },
    log: [...defaultState.log]
  };
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return createInitialState();
  }

  try {
    const parsed = JSON.parse(raw);

    return normalizeState({
      currentMission: Number.isInteger(parsed.currentMission) ? parsed.currentMission : 0,
      missionStates: Array.isArray(parsed.missionStates) && parsed.missionStates.length === missionDefinitions.length
        ? parsed.missionStates
        : [...defaultState.missionStates],
      rations: {
        coffee: Boolean(parsed.rations && parsed.rations.coffee),
        sweet: Boolean(parsed.rations && parsed.rations.sweet),
        miniFox: Boolean(parsed.rations && parsed.rations.miniFox)
      },
      log: Array.isArray(parsed.log) && parsed.log.length ? parsed.log : [...defaultState.log],
      missionComplete: Boolean(parsed.missionComplete),
      intelMessage: typeof parsed.intelMessage === 'string' ? parsed.intelMessage : ''
    });
  } catch (error) {
    console.warn('Failed to parse saved game state. Resetting to default.', error);
    return createInitialState();
  }
}

function normalizeState(candidate) {
  const normalized = {
    ...defaultState,
    ...candidate,
    missionStates: [...defaultState.missionStates],
    rations: { ...defaultState.rations, ...candidate.rations },
    log: Array.isArray(candidate.log) && candidate.log.length ? candidate.log.slice(0, 6) : [...defaultState.log]
  };
  const validStatuses = new Set(['locked', 'active', 'target-confirmed', 'complete']);
  const savedStates = Array.isArray(candidate.missionStates) ? candidate.missionStates : [];
  let firstIncomplete = missionDefinitions.length - 1;

  for (let index = 0; index < missionDefinitions.length; index += 1) {
    const savedStatus = validStatuses.has(savedStates[index]) ? savedStates[index] : 'locked';
    normalized.missionStates[index] = savedStatus;
    if (savedStatus !== 'complete' && firstIncomplete === missionDefinitions.length - 1) {
      firstIncomplete = index;
    }
  }

  if (normalized.missionStates.every((status) => status === 'complete')) {
    normalized.missionComplete = true;
    normalized.currentMission = missionDefinitions.length - 1;
    return normalized;
  }

  normalized.missionComplete = false;
  normalized.missionStates = normalized.missionStates.map((status, index) => {
    if (index < firstIncomplete) return 'complete';
    if (index === firstIncomplete) return status === 'target-confirmed' ? 'target-confirmed' : 'active';
    return 'locked';
  });
  normalized.currentMission = firstIncomplete;
  return normalized;
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function addLog(message) {
  state.log = [message, ...state.log].slice(0, 6);
  saveState();
}

function setIntelMessage(message) {
  state.intelMessage = message;
}

function getCurrentMissionIndex() {
  return state.currentMission;
}

function getMissionStatus(index) {
  return state.missionStates[index] || 'locked';
}

function allRationsChecked() {
  return Object.values(state.rations).every(Boolean);
}

function getStaminaValue() {
  return allRationsChecked() ? 100 : 18;
}

function setMissionState(index, status) {
  state.missionStates[index] = status;
}

function canRevealMissionLocation(index) {
  const status = getMissionStatus(index);
  if (status === 'target-confirmed' || status === 'complete') {
    return true;
  }

  if (index === 1 && (getMissionStatus(0) === 'target-confirmed' || getMissionStatus(0) === 'complete')) {
    return true;
  }

  return false;
}

function completeMission(index) {
  const missionStatus = getMissionStatus(index);

  if (missionStatus === 'locked' || index !== getCurrentMissionIndex()) {
    return;
  }

  setMissionState(index, 'complete');
  setIntelMessage('');
  addLog(`MISSION ${missionDefinitions[index].code}: ${missionDefinitions[index].label.toUpperCase()} COMPLETE.`);

  if (index < missionDefinitions.length - 1) {
    setMissionState(index + 1, 'active');
    state.currentMission = index + 1;
  } else {
    state.missionComplete = true;
    state.currentMission = index;
  }

  saveState();
  render();
}

function resetOperation() {
  APP_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
  state = createInitialState();
  closeMissionLog();
  render();
  console.log('Operation reset complete');
}

function renderMissionList() {
  if (!missionListEl) return;

  missionListEl.innerHTML = missionDefinitions
    .map((mission, index) => {
      const status = getMissionStatus(index);
      const itemClass = ['mission-item', status].join(' ');
      const revealLocation = canRevealMissionLocation(index);

      let subtitle = 'CLASSIFIED';
      if (status === 'locked') {
        subtitle = mission.type;
      } else if (status === 'active' && index === 1 && (getMissionStatus(0) === 'target-confirmed' || getMissionStatus(0) === 'complete')) {
        subtitle = mission.realLocation;
      } else if (status === 'target-confirmed' || status === 'complete' || revealLocation) {
        subtitle = mission.realLocation;
      }

      const badgeText = status === 'target-confirmed' ? 'TARGET CONFIRMED' : status.toUpperCase();

      return `
        <li>
          <button type="button" class="${itemClass}" data-mission-index="${index}" ${index !== getCurrentMissionIndex() || status === 'complete' ? 'disabled' : ''}>
            <span class="mission-code">${mission.code}</span>
            <span class="mission-operator mission-operator--${mission.operator}" aria-label="Primary agent: ${mission.operator}">${mission.icon}</span>
            <span class="mission-text">
              <span class="mission-title">${mission.label}</span>
              <span class="mission-subtitle">${subtitle}</span>
            </span>
            <span class="status-badge ${status === 'target-confirmed' ? 'target-confirmed' : status}">${badgeText}</span>
          </button>
        </li>
      `;
    })
    .join('');

  missionListEl.querySelectorAll('.mission-item').forEach((button) => {
    button.addEventListener('click', () => {
      const index = Number(button.dataset.missionIndex);
      if (index === getCurrentMissionIndex() && getMissionStatus(index) !== 'complete') {
        state.currentMission = index;
        saveState();
        render();
      }
    });
  });
}

function renderMissionLog() {
  if (!missionListOverlayEl) return;

  missionListOverlayEl.innerHTML = missionDefinitions
    .map((mission, index) => {
      const status = getMissionStatus(index);
      const statusText = status === 'target-confirmed' ? 'TARGET CONFIRMED' : status.toUpperCase();
      const label = `${mission.code} ${mission.label}`;
      return `
        <li>
          <button type="button" class="mission-log-item ${status}" data-mission-index="${index}" ${index !== getCurrentMissionIndex() || status === 'complete' ? 'disabled' : ''}>
            <span class="log-mission-name">${label}</span>
            <span class="log-mission-state">${statusText}</span>
          </button>
        </li>
      `;
    })
    .join('');

  missionListOverlayEl.querySelectorAll('.mission-log-item').forEach((button) => {
    button.addEventListener('click', () => {
      const index = Number(button.dataset.missionIndex);
      if (index === getCurrentMissionIndex() && getMissionStatus(index) !== 'complete') {
        state.currentMission = index;
        saveState();
        closeMissionLog();
        render();
      }
    });
  });
}

function renderMissionTitle(title) {
  return title
    .toUpperCase()
    .split(' ')
    .map((word) => `<span class="mission-title-word">${word}</span>`)
    .join('');
}

function renderMissionArtwork(index) {
  const labels = ['ASSEMBLY', 'RECON', 'ART', 'GREEN', 'HARBOUR', 'FINAL'];
  const tag = ['SECTOR 01', 'STEALTH', 'ART SECTOR', 'RATIONS', 'HARBOUR', 'EXTRACTION'];
  const mission = missionDefinitions[index];
  const revealLocation = canRevealMissionLocation(index);
  const visibleName = revealLocation ? mission.realLocation : 'CLASSIFIED';

  if (index === 1) {
    return `
      <div class="mission-visual-panel oodi-panel">
        <div class="visual-overlay" aria-hidden="true">
          <span class="scanline"></span>
          <span class="target-marker"></span>
          <span class="target-bracket bracket-tl"></span>
          <span class="target-bracket bracket-tr"></span>
          <span class="target-bracket bracket-bl"></span>
          <span class="target-bracket bracket-br"></span>
          <span class="target-label">${revealLocation ? 'TARGET CONFIRMED' : 'CLASSIFIED'}</span>
          <span class="target-name">${revealLocation ? mission.realLocation : '??'}</span>
          <span class="coord-block">
            <span>60.1718</span>
            <span>24.9387</span>
          </span>
          <span class="signal-chip">SIGNAL 87%</span>
        </div>

        <svg viewBox="0 0 540 360" class="mission-svg oodi-svg" role="img" aria-label="${visibleName} mission illustration">
          <g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M90 276V136L200 76L338 74L450 136V276H90Z" opacity="0.22"/>
            <path d="M130 270V186L214 146L270 128L328 142L410 184V270"/>
            <path d="M196 78L268 48L342 78"/>
            <path d="M133 182H410"/>
            <path d="M154 206H386"/>
            <path d="M166 232H374"/>
            <path d="M188 162V270M270 130V270M350 160V270"/>
            <path d="M90 270H450"/>
            <path d="M175 86L220 118L270 88L320 120L360 86"/>
            <path d="M222 118V270M318 120V270"/>
            <path d="M270 50V270"/>
            <path d="M154 150L96 126M386 150L444 126"/>
            <path d="M119 228L88 206M421 228L452 206"/>
            <path d="M93 270L147 214M447 270L393 214"/>
          </g>
          <g fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.75">
            <path d="M180 96H360"/>
            <path d="M160 116H380"/>
            <path d="M150 136H390"/>
            <path d="M170 156H370"/>
            <path d="M200 246H340"/>
          </g>
        </svg>

        <div class="mission-visual-meta">
          <span>${tag[index]}</span>
          <span>~ ${labels[index]}</span>
        </div>
        <div class="mission-evidence-label">PHOTO EVIDENCE REQUIRED</div>
      </div>
    `;
  }

  return `
    <div class="mission-visual-panel">
      <svg viewBox="0 0 520 300" class="mission-svg" role="img" aria-label="${visibleName} mission illustration">
        <g stroke="currentColor" stroke-width="1" opacity="0.18" fill="none">
          <path d="M0 150H520M260 0V300M80 0V300M440 0V300"/>
        </g>
        <g stroke="currentColor" stroke-width="1.2" opacity="0.8" fill="none">
          <circle cx="260" cy="150" r="94"/>
          <circle cx="260" cy="150" r="130"/>
          <circle cx="90" cy="90" r="10"/>
          <circle cx="430" cy="210" r="10"/>
        </g>
        <g stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
          ${index === 0 ? `
            <path d="M110 200L200 160L260 205L345 145L430 180"/>
            <path d="M180 120L230 80L260 110L300 80L340 120"/>
            <circle cx="260" cy="150" r="24"/>
          ` : ''}
          ${index === 2 ? `
            <path d="M120 210H400V90H120Z"/>
            <path d="M165 210V90M260 210V90M355 210V90"/>
            <path d="M120 150H400M200 90V210M320 90V210"/>
            <path d="M170 100L260 40L350 100"/>
          ` : ''}
          ${index === 3 ? `
            <path d="M130 215H390"/>
            <path d="M155 215V178H200V215"/>
            <path d="M300 215V170H360V215"/>
            <path d="M220 150C220 121 263 121 263 150C263 178 220 178 220 150Z"/>
            <path d="M346 138L385 98"/>
            <path d="M346 158L395 140"/>
          ` : ''}
          ${index === 4 ? `
            <path d="M90 210H430"/>
            <path d="M120 210C120 140 165 120 195 120C210 120 235 134 240 165C246 205 225 220 210 220H120Z"/>
            <path d="M300 220C295 190 315 155 350 150C385 145 410 170 405 200"/>
            <path d="M245 130L262 104L278 130"/>
            <path d="M340 104L356 138L372 104"/>
          ` : ''}
          ${index === 5 ? `
            <path d="M160 174L260 90L360 174L300 220H220Z"/>
            <path d="M220 220L260 135L300 220"/>
            <path d="M188 182H332"/>
            <path d="M260 84V220"/>
            <circle cx="260" cy="150" r="38"/>
          ` : ''}
        </g>
      </svg>
      <div class="mission-visual-meta">
        <span>${tag[index]}</span>
        <span>~ ${labels[index]}</span>
      </div>
    </div>
  `;
}

function renderMissionTelemetry(index = getCurrentMissionIndex()) {
  const mission = missionDefinitions[index];
  const status = getMissionStatus(index);
  const location = canRevealMissionLocation(index) ? mission.realLocation : 'CLASSIFIED';

  if (index === 1) {
    return `
      <aside class="mission-telemetry compact" aria-label="Mission telemetry">
        <div class="telemetry-meta compact-meta">
          <div class="telemetry-row"><span>LOCATION</span><strong>${location}</strong></div>
          <div class="telemetry-row"><span>STATUS</span><strong>${status === 'target-confirmed' ? 'TARGET CONFIRMED' : status.toUpperCase().replace('-', ' ')}</strong></div>
          <div class="telemetry-row"><span>SIGNAL</span><strong>87%</strong></div>
          <div class="telemetry-row"><span>MODE</span><strong>FAMILY MODE</strong></div>
        </div>
      </aside>
    `;
  }

  return `
    <aside class="mission-telemetry" aria-label="Mission telemetry">
      <div class="telemetry-radar" aria-hidden="true">
        <span class="telemetry-ring ring-1"></span>
        <span class="telemetry-ring ring-2"></span>
        <span class="telemetry-core"></span>
        <span class="telemetry-wave"></span>
      </div>

      <div class="telemetry-meta">
        <div class="telemetry-row"><span>LOCATION</span><strong>${location}</strong></div>
        <div class="telemetry-row"><span>STATUS</span><strong>${status === 'target-confirmed' ? 'TARGET CONFIRMED' : status.toUpperCase().replace('-', ' ')}</strong></div>
        <div class="telemetry-row"><span>SIGNAL</span><strong>87%</strong></div>
        <div class="telemetry-row"><span>MODE</span><strong>FAMILY MODE</strong></div>
      </div>

      <div class="telemetry-coords">
        <span>60.1699</span>
        <span>24.9384</span>
      </div>
    </aside>
  `;
}

function renderMissionContent() {
  const index = getCurrentMissionIndex();
  const mission = missionDefinitions[index];
  const status = getMissionStatus(index);
  const missionNumber = String(index + 1).padStart(2, '0');

  missionCounterEl.textContent = `${missionNumber} / ${String(missionDefinitions.length).padStart(2, '0')}`;
  missionIndexLabelEl.textContent = missionNumber;
  missionActiveLabelEl.textContent = state.missionComplete ? 'OPERATION COMPLETE' : 'ACTIVE MISSION';

  const revealLocation = canRevealMissionLocation(index);
  const locationDisplay = revealLocation ? mission.realLocation : 'CLASSIFIED';
  const intelFeedback = state.intelMessage
    ? `<div class="mission-status-banner mission-status-banner--negative"><span>${state.intelMessage}</span></div>`
    : '';

  const missionStateBanner = (() => {
    if (status === 'target-confirmed') {
      return `<div class="mission-status-banner mission-status-banner--success"><span>TARGET CONFIRMED</span><span>${mission.realLocation} IDENTIFIED</span></div>`;
    }

    if (status === 'complete') {
      return `<div class="mission-status-banner"><span>COMPLETE</span><span>${mission.realLocation}</span></div>`;
    }

    return `<div class="mission-status-banner mission-status-banner--muted"><span>CLASSIFIED</span><span>${locationDisplay}</span></div>`;
  })();
  const choiceButtons = mission.choices && status !== 'locked'
    ? mission.choices.map((choice) => `
        <button type="button" class="mission-choice-btn" data-choice="${choice}" ${status === 'target-confirmed' || status === 'complete' ? 'disabled' : ''}>
          ${choice}
        </button>
      `).join('')
    : '';

  if (index === 0) {
    missionContentEl.innerHTML = `
      <div class="mission-panel-layout">
        <div class="mission-main-copy">
          <div class="mission-headline">
            <h1 id="missionTitle">${renderMissionTitle(mission.label)}</h1>
          </div>

          ${renderMissionArtwork(0)}

          ${missionStateBanner}
          ${intelFeedback}

          <div class="mission-objective-block">
            <p class="objective-label">OBJECTIVE</p>
            <p class="mission-objective">${mission.objective}</p>
          </div>

          <div class="mission-objective-block mission-objective-block--compact">
            <p class="objective-label">CLUE</p>
            <p class="mission-objective mission-objective--clue">${mission.clue}</p>
          </div>

          ${choiceButtons ? `<div class="mission-choice-grid">${choiceButtons}</div>` : ''}

          <div class="squad-status-row" aria-label="Squad status">
            <span>SNAKE</span>
            <span class="status-divider">●</span>
            <span>COMMAND</span>
            <span class="status-divider">●</span>
            <span>MINI FOX</span>
          </div>

          <div class="briefing-block">
            <p class="briefing-label">BRIEFING</p>
            <p class="mission-briefing">${mission.brief}</p>
          </div>
        </div>

        ${renderMissionTelemetry()}
      </div>
    `;

    missionContentEl.querySelectorAll('.mission-choice-btn').forEach((button) => {
      button.addEventListener('click', () => {
        handleChoiceSelection(index, button.dataset.choice);
      });
    });
  }

  if (index === 1) {
    missionContentEl.innerHTML = `
      <div class="mission-panel-layout mission-panel-layout--story">
        <div class="mission-main-copy">
          <div class="mission-headline">
            <h1 id="missionTitle">${renderMissionTitle(mission.label)}</h1>
          </div>

          ${renderMissionArtwork(1)}

          <div class="mission-objective-block">
            <p class="objective-label">OBJECTIVE</p>
            <p class="mission-objective">${mission.objective}</p>
          </div>

          <div class="mission-evidence-grid">
            <div class="evidence-module">
              <div class="evidence-header">
                <span>PHOTO EVIDENCE</span>
                <span class="evidence-status">REQUIRED</span>
              </div>
              <div class="evidence-icon camera-icon" aria-hidden="true">
                <span class="camera-frame"></span>
                <span class="camera-lens"></span>
              </div>
            </div>

            <div class="evidence-module">
              <div class="evidence-header">
                <span>COVER CHECK</span>
                <span class="evidence-status">PENDING</span>
              </div>
              <div class="evidence-icon conceal-icon" aria-hidden="true">
                <span class="conceal-shape"></span>
                <span class="conceal-shape conceal-shape--small"></span>
              </div>
            </div>
          </div>
        </div>

        ${renderMissionTelemetry(1)}
      </div>
    `;
  }

  if (index === 2) {
    missionContentEl.innerHTML = `
      <div class="mission-panel-layout">
        <div class="mission-main-copy">
          <div class="mission-headline">
            <h1 id="missionTitle">${renderMissionTitle(mission.label)}</h1>
          </div>

          ${renderMissionArtwork(2)}

          ${missionStateBanner}
          ${intelFeedback}

          <div class="mission-objective-block">
            <p class="objective-label">OBJECTIVE</p>
            <p class="mission-objective">${mission.objective}</p>
          </div>

          <div class="mission-objective-block mission-objective-block--compact">
            <p class="objective-label">CLUE</p>
            <p class="mission-objective mission-objective--clue">${mission.clue}</p>
          </div>

          ${choiceButtons ? `<div class="mission-choice-grid">${choiceButtons}</div>` : ''}

          <div class="mission-photo-grid">
            <div class="mission-photo">FUTURE ANGLE</div>
            <div class="mission-photo">SECRET TECH</div>
          </div>
        </div>

        ${renderMissionTelemetry()}
      </div>
    `;

    missionContentEl.querySelectorAll('.mission-choice-btn').forEach((button) => {
      button.addEventListener('click', () => {
        handleChoiceSelection(index, button.dataset.choice);
      });
    });
  }

  if (index === 3) {
    const stamina = getStaminaValue();
    missionContentEl.innerHTML = `
      <div class="mission-panel-layout">
        <div class="mission-main-copy">
          <div class="mission-headline">
            <h1 id="missionTitle">${renderMissionTitle(mission.label)}</h1>
          </div>

          ${renderMissionArtwork(3)}

          ${missionStateBanner}
          ${intelFeedback}

          <div class="mission-objective-block">
            <p class="objective-label">OBJECTIVE</p>
            <p class="mission-objective">${mission.objective}</p>
          </div>

          <div class="mission-objective-block mission-objective-block--compact">
            <p class="objective-label">CLUE</p>
            <p class="mission-objective mission-objective--clue">${mission.clue}</p>
          </div>

          ${choiceButtons ? `<div class="mission-choice-grid">${choiceButtons}</div>` : ''}

          <div class="ration-list">
            ${[
              ['coffee', 'Coffee'],
              ['sweet', 'Sweet ration'],
              ['miniFox', 'Mini Fox ration']
            ].map(([key, label]) => `
              <div class="ration-item">
                <label for="ration-${key}">
                  <input id="ration-${key}" type="checkbox" data-ration-key="${key}" ${state.rations[key] ? 'checked' : ''} />
                  <span>${label}</span>
                </label>
              </div>
            `).join('')}
          </div>

          <div class="stamina-panel">
            <div class="stamina-top">
              <span>Stamina</span>
              <span>${stamina}%</span>
            </div>
            <div class="stamina-meter">
              <span class="stamina-fill" style="width: ${stamina}%"></span>
            </div>
          </div>
        </div>

        ${renderMissionTelemetry()}
      </div>
    `;

    missionContentEl.querySelectorAll('.mission-choice-btn').forEach((button) => {
      button.addEventListener('click', () => {
        handleChoiceSelection(index, button.dataset.choice);
      });
    });

    missionContentEl.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
      checkbox.addEventListener('change', (event) => {
        const key = event.target.dataset.rationKey;
        state.rations[key] = event.target.checked;
        saveState();
        render();
      });
    });
  }

  if (index === 4) {
    missionContentEl.innerHTML = `
      <div class="mission-panel-layout">
        <div class="mission-main-copy">
          <div class="mission-headline">
            <h1 id="missionTitle">${renderMissionTitle(mission.label)}</h1>
          </div>

          ${renderMissionArtwork(4)}

          ${missionStateBanner}
          ${intelFeedback}

          <div class="mission-objective-block">
            <p class="objective-label">OBJECTIVE</p>
            <p class="mission-objective">${mission.objective}</p>
          </div>

          <div class="mission-objective-block mission-objective-block--compact">
            <p class="objective-label">CLUE</p>
            <p class="mission-objective mission-objective--clue">${mission.clue}</p>
          </div>

          ${choiceButtons ? `<div class="mission-choice-grid">${choiceButtons}</div>` : ''}

          <div class="mission-photo-grid">
            <div class="mission-photo">SEAGULL</div>
            <div class="mission-photo">SNACK GUARD</div>
          </div>
        </div>

        ${renderMissionTelemetry()}
      </div>
    `;

    missionContentEl.querySelectorAll('.mission-choice-btn').forEach((button) => {
      button.addEventListener('click', () => {
        handleChoiceSelection(index, button.dataset.choice);
      });
    });
  }

  if (index === 5) {
    const isComplete = state.missionComplete;

    missionContentEl.innerHTML = `
      <div class="mission-panel-layout">
        <div class="mission-main-copy">
          <div class="mission-headline">
            <h1 id="missionTitle">${renderMissionTitle(mission.label)}</h1>
          </div>

          ${renderMissionArtwork(5)}

          <div class="mission-status-banner ${isComplete ? 'mission-status-banner--success' : 'mission-status-banner--muted'}">
            <span>${isComplete ? 'MISSION COMPLETE' : 'FINAL EXTRACTION'}</span>
            <span>${isComplete ? 'FAMILY S' : 'CLASSIFIED'}</span>
          </div>

          <div class="mission-objective-block">
            <p class="objective-label">OBJECTIVE</p>
            <p class="mission-objective">${mission.objective}</p>
          </div>

          <div class="squad-status-row" aria-label="Squad status">
            <span>SNAKE</span>
            <span class="status-divider">●</span>
            <span>COMMAND</span>
            <span class="status-divider">●</span>
            <span>MINI FOX</span>
          </div>

          <div class="final-banner">
            <strong>${isComplete ? 'MISSION COMPLETE' : 'FINAL EXTRACTION'}</strong>
            <span>${isComplete ? 'FINAL RANK: FAMILY S' : 'TARGET SECURED'}</span>
          </div>
        </div>

        ${renderMissionTelemetry()}
      </div>
    `;
  }
}

function handleChoiceSelection(index, selectedChoice) {
  const mission = missionDefinitions[index];
  const status = getMissionStatus(index);

  if (!mission.choices || status === 'locked' || status === 'target-confirmed' || status === 'complete') {
    return;
  }

  if (selectedChoice === mission.correctChoice) {
    setMissionState(index, 'target-confirmed');
    setIntelMessage(`TARGET CONFIRMED // ${mission.realLocation} IDENTIFIED`);
    addLog(`TARGET CONFIRMED: ${mission.realLocation} IDENTIFIED.`);
    render();
    return;
  }

  const negativeMessage = 'NEGATIVE. RECHECK INTELLIGENCE.';
  setIntelMessage(negativeMessage);
  addLog(negativeMessage);
  render();
}

function handleMissionAction() {
  const index = getCurrentMissionIndex();
  const mission = missionDefinitions[index];
  const status = getMissionStatus(index);

  if (status === 'locked') {
    return;
  }

  if (index !== getCurrentMissionIndex()) {
    return;
  }

  if (mission.choices && status === 'active') {
    addLog('TARGET CONFIRMATION REQUIRED.');
    render();
    return;
  }

  if (index === 3 && !allRationsChecked()) {
    addLog('RATION STATUS: INCOMPLETE. ALL ITEMS REQUIRED.');
    renderMissionLog();
    return;
  }

  if (index === 5 && state.missionComplete) {
    return;
  }

  completeMission(index);
}

function updateMissionActionButton() {
  const index = getCurrentMissionIndex();
  const mission = missionDefinitions[index];
  const status = getMissionStatus(index);

  if (status === 'locked') {
    missionActionBtn.disabled = true;
    missionActionBtn.textContent = 'LOCKED';
    return;
  }

  if (state.missionComplete && index === 5) {
    missionActionBtn.disabled = true;
    missionActionBtn.textContent = 'MISSION COMPLETE';
    return;
  }

  if (mission.choices && status === 'active') {
    missionActionBtn.disabled = true;
    missionActionBtn.textContent = 'TARGET CONFIRMATION';
    return;
  }

  if (status === 'target-confirmed') {
    missionActionBtn.disabled = false;
    missionActionBtn.textContent = 'COMPLETE MISSION';
    return;
  }

  if (index === 3) {
    missionActionBtn.disabled = !allRationsChecked();
    missionActionBtn.textContent = allRationsChecked() ? 'SECURE RATIONS' : 'REQUIRE RATIONS';
    return;
  }

  missionActionBtn.disabled = false;
  missionActionBtn.textContent = index === 5 ? 'FINAL EXTRACTION' : 'COMPLETE MISSION';
}

function render() {
  renderMissionList();
  renderMissionLog();
  renderMissionContent();
  updateMissionActionButton();

  const panel = document.querySelector('.mission-panel');
  if (panel) {
    panel.classList.remove('mission-panel-animate');
    void panel.offsetWidth;
    panel.classList.add('mission-panel-animate');
  }
}

function openMissionLog() {
  missionLogOverlay.classList.add('open');
  missionLogOverlay.setAttribute('aria-hidden', 'false');
}

function closeMissionLog() {
  missionLogOverlay.classList.remove('open');
  missionLogOverlay.setAttribute('aria-hidden', 'true');
}

missionActionBtn.addEventListener('click', handleMissionAction);
document.querySelectorAll('.reset-operation-btn').forEach((button) => {
  button.addEventListener('click', () => {
    resetDialog.showModal();
  });
});

resetCancelBtn.addEventListener('click', () => {
  resetDialog.close();
});

resetConfirmBtn.addEventListener('click', () => {
  resetDialog.close();
  resetOperation();
});

missionLogToggle.addEventListener('click', openMissionLog);
missionLogClose.addEventListener('click', closeMissionLog);
missionLogOverlay.addEventListener('click', (event) => {
  if (event.target === missionLogOverlay) {
    closeMissionLog();
  }
});

render();
