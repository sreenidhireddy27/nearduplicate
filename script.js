/**
 * Near Duplicate Document Detection Framework
 * Real mathematical implementations of:
 * - Preprocessing & Tokenization
 * - K-Shingling
 * - 32-bit Polynomial Rolling Hashing
 * - MinHash Signature Vector Matrix
 * - Locality Sensitive Hashing (LSH) Banding
 * - Jaccard Exact & Estimated Similarity
 */

// Global State
let docA_raw = "";
let docB_raw = "";
let currentShingleK = 3;
let currentMinHashCount = 64;
let currentLshBands = 16;
let cachedShinglesA = [];
let cachedShinglesB = [];
let cachedCommonShingles = [];
let scalabilityChartInstance = null;

// Benchmark Presets
const PRESETS = {
  plagiarism: {
    a: "Machine learning algorithms have revolutionized natural language processing and computer vision applications across diverse industries. Deep neural architectures require extensive dataset training on specialized graphical processing hardware.",
    b: "Machine learning algorithms have transformed natural language processing and computer vision systems across modern industries. Deep neural networks demand massive dataset training on GPU hardware."
  },
  identical: {
    a: "Locality Sensitive Hashing reduces high dimensional nearest neighbor queries from quadratic asymptotic complexity down to sub-linear lookup times using hash table collisions.",
    b: "Locality Sensitive Hashing reduces high dimensional nearest neighbor queries from quadratic asymptotic complexity down to sub-linear lookup times using hash table collisions."
  },
  unrelated: {
    a: "Photosynthesis is the biological process used by green plants and specific cellular organisms to convert light energy into chemical energy stored in glucose carbohydrate molecules.",
    b: "Quantum computing harnesses the phenomena of quantum mechanical superposition and quantum entanglement to perform high dimensional tensor calculations in polynomial time."
  }
};

// Initialization on DOM Load
document.addEventListener("DOMContentLoaded", () => {
  setupEventListeners();
  loadPreset('plagiarism');
  initScalabilityChart();
});

function setupEventListeners() {
  document.getElementById("docA").addEventListener("input", updateCounts);
  document.getElementById("docB").addEventListener("input", updateCounts);
  
  document.getElementById("shingleK").addEventListener("change", (e) => {
    currentShingleK = parseInt(e.target.value);
    document.getElementById("currentKDisplay").innerText = currentShingleK;
  });

  document.getElementById("numHash").addEventListener("change", (e) => {
    currentMinHashCount = parseInt(e.target.value);
    document.getElementById("hashFunctionsBadge").innerText = `${currentMinHashCount} Universal Hash Permutations`;
  });

  document.getElementById("lshBands").addEventListener("change", (e) => {
    currentLshBands = parseInt(e.target.value);
  });
}

function updateCounts() {
  const textA = document.getElementById("docA").value;
  const textB = document.getElementById("docB").value;

  const wordsA = textA.trim() ? textA.trim().split(/\s+/).length : 0;
  const wordsB = textB.trim() ? textB.trim().split(/\s+/).length : 0;

  document.getElementById("wordCountA").innerText = wordsA;
  document.getElementById("charCountA").innerText = textA.length;

  document.getElementById("wordCountB").innerText = wordsB;
  document.getElementById("charCountB").innerText = textB.length;
}

function loadPreset(key) {
  // Update button active state
  const buttons = document.querySelectorAll(".btn-preset");
  buttons.forEach(b => b.classList.remove("active"));
  const clicked = Array.from(buttons).find(b => b.innerText.toLowerCase().includes(key));
  if (clicked) clicked.classList.add("active");

  const preset = PRESETS[key];
  if (preset) {
    document.getElementById("docA").value = preset.a;
    document.getElementById("docB").value = preset.b;
    updateCounts();
  }
}

function clearInputs() {
  document.getElementById("docA").value = "";
  document.getElementById("docB").value = "";
  updateCounts();
}

function handleFileUpload(event, targetDocId) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    document.getElementById(targetDocId).value = e.target.result;
    updateCounts();
  };
  reader.readAsText(file);
}

/* ========================================================
   DSA Pipeline Core Algorithms
======================================================== */

/**
 * 1. Preprocessing & Tokenization
 * Strips punctuation, transforms to lowercase, and splits into clean token array.
 */
function preprocessText(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(token => token.length > 0);
}

/**
 * 2. K-Shingling
 * Creates sets of contiguous k-word shingles.
 */
function generateKShingles(tokens, k) {
  if (tokens.length < k) {
    return tokens.length > 0 ? [tokens.join(' ')] : [];
  }
  const shingles = [];
  for (let i = 0; i <= tokens.length - k; i++) {
    shingles.push(tokens.slice(i, i + k).join(' '));
  }
  return Array.from(new Set(shingles)); // Return unique set
}

/**
 * 3. Polynomial Rolling Hashing
 * Horner's method mapping string to deterministic 32-bit unsigned integer.
 * h = (sum s[i] * 31^(k-1-i)) mod 2^32
 */
function polynomialHash(str) {
  let hash = 0;
  const p = 31;
  const m = 4294967296; // 2^32
  for (let i = 0; i < str.length; i++) {
    hash = (hash * p + str.charCodeAt(i)) % m;
  }
  return hash >>> 0; // Unsigned 32-bit integer
}

/**
 * Universal Hash Generator for MinHash
 * Generates parameters (a, b, prime) for h_i(x) = (a * x + b) mod p
 */
function createHashFunctions(numFunctions) {
  const prime = 4294967311; // Large prime > 2^32
  const functions = [];
  // Use a pseudo-random seed to ensure deterministic evaluation per run
  let seed = 1337;
  function pseudoRandom() {
    seed = (seed * 16807) % 2147483647;
    return seed;
  }

  for (let i = 0; i < numFunctions; i++) {
    const a = (pseudoRandom() % (prime - 1)) + 1;
    const b = pseudoRandom() % prime;
    functions.push({ a, b, prime });
  }
  return functions;
}

/**
 * 4. MinHash Signature Computation
 * Computes signature vector S of size m, where S[i] = min(h_i(shingle_hash))
 */
function computeMinHashSignature(hashedShingles, hashFunctions) {
  const signature = [];
  if (hashedShingles.length === 0) {
    return new Array(hashFunctions.length).fill(0);
  }

  for (let i = 0; i < hashFunctions.length; i++) {
    const { a, b, prime } = hashFunctions[i];
    let minVal = Infinity;
    for (let j = 0; j < hashedShingles.length; j++) {
      const val = (a * hashedShingles[j] + b) % prime;
      if (val < minVal) {
        minVal = val;
      }
    }
    signature.push(minVal);
  }
  return signature;
}

/**
 * 5. Locality Sensitive Hashing (LSH)
 * Divides signature into b bands of r rows. Hashes each band into buckets.
 */
function evaluateLSH(sigA, sigB, numBands) {
  const m = sigA.length;
  const rowsPerBand = Math.floor(m / numBands);
  const bandResults = [];
  let isCandidate = false;

  for (let b = 0; b < numBands; b++) {
    const bandA = sigA.slice(b * rowsPerBand, (b + 1) * rowsPerBand);
    const bandB = sigB.slice(b * rowsPerBand, (b + 1) * rowsPerBand);

    // Compute simple band bucket hash
    const hashA = polynomialHash(bandA.join("-"));
    const hashB = polynomialHash(bandB.join("-"));
    const match = hashA === hashB;

    if (match) isCandidate = true;

    bandResults.push({
      bandIndex: b + 1,
      hashA: hashA.toString(16).substring(0, 8),
      hashB: hashB.toString(16).substring(0, 8),
      match: match
    });
  }

  return { isCandidate, bandResults, rowsPerBand };
}

/* ========================================================
   Full Pipeline Orchestrator & Animation
======================================================== */

async function executeFullPipeline() {
  const textA = document.getElementById("docA").value.trim();
  const textB = document.getElementById("docB").value.trim();

  if (!textA || !textB) {
    alert("Please ensure both Document A and Document B contain text.");
    return;
  }

  // Visual Loading Feedback
  const btn = document.getElementById("runBtn");
  const spinner = document.getElementById("btnSpinner");
  const icon = document.getElementById("btnIcon");
  btn.disabled = true;
  spinner.style.display = "inline-block";
  icon.style.display = "none";

  const startTime = performance.now();

  // Highlight step nodes progressively
  for (let step = 1; step <= 7; step++) {
    setStepState(step, 'active');
    await new Promise(r => setTimeout(r, 60)); // Fast responsive micro-delay
  }

  // 1. Preprocessing
  const tokensA = preprocessText(textA);
  const tokensB = preprocessText(textB);

  // 2. K-Shingling
  const shinglesA = generateKShingles(tokensA, currentShingleK);
  const shinglesB = generateKShingles(tokensB, currentShingleK);
  cachedShinglesA = shinglesA;
  cachedShinglesB = shinglesB;

  // 3. Exact Jaccard Calculation
  const setA = new Set(shinglesA);
  const setB = new Set(shinglesB);
  const intersection = shinglesA.filter(x => setB.has(x));
  cachedCommonShingles = intersection;

  const unionSet = new Set([...shinglesA, ...shinglesB]);
  const jaccardExact = unionSet.size > 0 ? (intersection.length / unionSet.size) : 0;

  // 4. Polynomial Hashing
  const hashedShinglesA = shinglesA.map(s => polynomialHash(s));
  const hashedShinglesB = shinglesB.map(s => polynomialHash(s));

  // 5. MinHash Signatures
  const hashFuncs = createHashFunctions(currentMinHashCount);
  const sigA = computeMinHashSignature(hashedShinglesA, hashFuncs);
  const sigB = computeMinHashSignature(hashedShinglesB, hashFuncs);

  // MinHash Estimated Similarity: Proportion of matching signature components
  let matchingEntries = 0;
  for (let i = 0; i < currentMinHashCount; i++) {
    if (sigA[i] === sigB[i]) matchingEntries++;
  }
  const minhashEstimate = matchingEntries / currentMinHashCount;

  // 6. LSH Candidate Detection
  const lsh = evaluateLSH(sigA, sigB, currentLshBands);

  const endTime = performance.now();
  const executionTime = (endTime - startTime).toFixed(1);

  // Mark all pipeline steps completed
  for (let step = 1; step <= 7; step++) {
    setStepState(step, 'completed');
  }

  // Render All UI Sections
  renderSummaryVerdict(jaccardExact, minhashEstimate, lsh.isCandidate, executionTime, intersection.length);
  renderJaccardMetrics(shinglesA.length, shinglesB.length, intersection.length, unionSet.size, jaccardExact);
  renderMinHashMetrics(jaccardExact, minhashEstimate);
  renderShinglesView('docA');
  renderHashTable(shinglesA, hashedShinglesA, shinglesB, hashedShinglesB);
  renderSignatureMatrix(sigA, sigB);
  renderLshBands(lsh);

  // Restore button
  btn.disabled = false;
  spinner.style.display = "none";
  icon.style.display = "inline-block";
}

function setStepState(stepNum, state) {
  const card = document.getElementById(`step-${stepNum}`);
  if (!card) return;
  card.classList.remove('active', 'completed');
  if (state) card.classList.add(state);
}

/* ========================================================
   UI Renderers
======================================================== */

function renderSummaryVerdict(jaccard, minhashEst, isCandidate, timeMs, commonCount) {
  const verdictEl = document.getElementById("finalVerdictStatus");
  const descEl = document.getElementById("finalVerdictDesc");
  const timeEl = document.getElementById("resProcTime");
  const candEl = document.getElementById("resLshCandidate");
  const commonEl = document.getElementById("resCommonCount");

  timeEl.innerText = `${timeMs} ms`;
  commonEl.innerText = commonCount;
  candEl.innerText = isCandidate ? "YES (Collision Detected)" : "NO (Non-Candidate)";
  candEl.style.color = isCandidate ? "var(--accent-green)" : "var(--accent-red)";

  if (jaccard >= 0.8) {
    verdictEl.innerText = "Near Duplicate Detected";
    verdictEl.style.color = "#10B981";
    descEl.innerText = "Documents share overwhelming textual structure and n-gram permutations. Very High similarity threshold satisfied.";
  } else if (jaccard >= 0.6) {
    verdictEl.innerText = "High Similarity Detected";
    verdictEl.style.color = "#3B82F6";
    descEl.innerText = "Substantial portions of phrasing and structure match. Documents are likely close revisions or paraphrases.";
  } else if (jaccard >= 0.35) {
    verdictEl.innerText = "Moderate Overlap";
    verdictEl.style.color = "#F59E0B";
    descEl.innerText = "Common topical terminology discovered, but documents maintain distinct contextual structures.";
  } else {
    verdictEl.innerText = "Distinct / Low Similarity";
    verdictEl.style.color = "#94A3B8";
    descEl.innerText = "Documents share little to no overlapping shingles. Safe to classify as independent texts.";
  }

  // Render SVG Circle Progress
  const circle = document.getElementById("jaccardCircle");
  const pctText = document.getElementById("exactJaccardPct");
  const radius = circle.r.baseVal.value;
  const circumference = 2 * Math.PI * radius;

  circle.style.strokeDasharray = `${circumference} ${circumference}`;
  const offset = circumference - (jaccard * circumference);
  circle.style.strokeDashoffset = offset;
  pctText.innerText = `${(jaccard * 100).toFixed(1)}%`;
}

function renderJaccardMetrics(countA, countB, inter, union, jaccard) {
  document.getElementById("countA").innerText = countA;
  document.getElementById("countB").innerText = countB;
  document.getElementById("intersectionCount").innerText = inter;
  document.getElementById("unionCount").innerText = union;

  const badge = document.getElementById("classBadge");
  const desc = document.getElementById("classDesc");

  if (jaccard >= 0.8) {
    badge.innerText = "Very High Similarity (80% - 100%)";
    badge.style.background = "rgba(16, 185, 129, 0.2)";
    badge.style.color = "#6EE7B7";
    desc.innerText = "Eligible for automatic deduplication or near-duplicate archiving.";
  } else if (jaccard >= 0.6) {
    badge.innerText = "High Similarity (60% - 79%)";
    badge.style.background = "rgba(59, 130, 246, 0.2)";
    badge.style.color = "#93C5FD";
    desc.innerText = "Strong candidate for manual peer review or plagiarism detection flags.";
  } else if (jaccard >= 0.4) {
    badge.innerText = "Moderate Similarity (40% - 59%)";
    badge.style.background = "rgba(245, 158, 11, 0.2)";
    badge.style.color = "#FCD34D";
    desc.innerText = "Contextual topic overlap without extensive verbatim copying.";
  } else {
    badge.innerText = "Low Similarity (Below 40%)";
    badge.style.background = "rgba(255, 255, 255, 0.08)";
    badge.style.color = "#94A3B8";
    desc.innerText = "Standard non-duplicate document pair.";
  }
}

function renderMinHashMetrics(exact, estimate) {
  document.getElementById("meterExactText").innerText = `${(exact * 100).toFixed(2)}%`;
  document.getElementById("meterMinhashText").innerText = `${(estimate * 100).toFixed(2)}%`;

  document.getElementById("meterExactFill").style.width = `${(exact * 100).toFixed(1)}%`;
  document.getElementById("meterMinhashFill").style.width = `${(estimate * 100).toFixed(1)}%`;

  const delta = Math.abs(exact - estimate) * 100;
  document.getElementById("absErrorDelta").innerText = `${delta.toFixed(2)}%`;
}

function switchShingleView(viewKey) {
  const tabs = document.querySelectorAll(".shingle-tab");
  tabs.forEach(t => t.classList.remove("active"));
  event.target.classList.add("active");
  renderShinglesView(viewKey);
}

function renderShinglesView(viewKey) {
  document.getElementById("tabCountA").innerText = cachedShinglesA.length;
  document.getElementById("tabCountB").innerText = cachedShinglesB.length;
  document.getElementById("tabCountCommon").innerText = cachedCommonShingles.length;

  const container = document.getElementById("shingleChipsContainer");
  container.innerHTML = "";

  const commonSet = new Set(cachedCommonShingles);
  let targetList = [];

  if (viewKey === 'docA') targetList = cachedShinglesA;
  else if (viewKey === 'docB') targetList = cachedShinglesB;
  else targetList = cachedCommonShingles;

  if (targetList.length === 0) {
    container.innerHTML = `<div class="empty-state">No shingles found in this view.</div>`;
    return;
  }

  // Display up to 60 shingles to maintain DOM efficiency
  const maxDisplay = Math.min(targetList.length, 60);
  for (let i = 0; i < maxDisplay; i++) {
    const s = targetList[i];
    const isCommon = commonSet.has(s);
    const chip = document.createElement("span");
    chip.className = `shingle-chip ${isCommon ? 'common' : ''}`;
    chip.innerText = s;
    container.appendChild(chip);
  }

  if (targetList.length > 60) {
    const extra = document.createElement("span");
    extra.className = "shingle-chip";
    extra.innerText = `+${targetList.length - 60} more...`;
    container.appendChild(extra);
  }
}

function renderHashTable(shinglesA, hashA, shinglesB, hashB) {
  const tbody = document.getElementById("hashTableBody");
  tbody.innerHTML = "";

  const combined = [];
  for (let i = 0; i < Math.min(shinglesA.length, 4); i++) {
    combined.push({ shingle: shinglesA[i], doc: "Doc A", hash: hashA[i] });
  }
  for (let i = 0; i < Math.min(shinglesB.length, 4); i++) {
    combined.push({ shingle: shinglesB[i], doc: "Doc B", hash: hashB[i] });
  }

  if (combined.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3" class="text-center">No shingles hashed yet.</td></tr>`;
    return;
  }

  combined.forEach(item => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(item.shingle)}</td>
      <td><span class="badge ${item.doc === 'Doc A' ? 'badge-accent' : ''}">${item.doc}</span></td>
      <td>0x${item.hash.toString(16).toUpperCase().padStart(8, '0')} (${item.hash})</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderSignatureMatrix(sigA, sigB) {
  const headerRow = document.getElementById("matrixHeaderRow");
  const body = document.getElementById("matrixBody");

  // Show first 12 hash function dimensions in preview
  const previewDim = Math.min(sigA.length, 12);
  headerRow.innerHTML = `<th>Doc Vector</th>`;
  for (let i = 0; i < previewDim; i++) {
    headerRow.innerHTML += `<th>h_${i + 1}</th>`;
  }

  body.innerHTML = "";

  const rowA = document.createElement("tr");
  rowA.innerHTML = `<td><strong>Sig(A)</strong></td>`;
  for (let i = 0; i < previewDim; i++) {
    rowA.innerHTML += `<td>${sigA[i]}</td>`;
  }
  body.appendChild(rowA);

  const rowB = document.createElement("tr");
  rowB.innerHTML = `<td><strong>Sig(B)</strong></td>`;
  for (let i = 0; i < previewDim; i++) {
    const isMatch = sigA[i] === sigB[i];
    rowB.innerHTML += `<td class="${isMatch ? 'equal-val' : ''}">${sigB[i]}</td>`;
  }
  body.appendChild(rowB);
}

function renderLshBands(lsh) {
  const grid = document.getElementById("lshBandsGrid");
  const verdictTitle = document.getElementById("lshCandidateTitle");
  const verdictDesc = document.getElementById("lshCandidateDesc");
  const statusDot = document.getElementById("lshStatusDot");

  document.getElementById("lshParamsBadge").innerText = `b = ${lsh.bandResults.length} bands, r = ${lsh.rowsPerBand} rows/band`;
  grid.innerHTML = "";

  let collisionCount = 0;

  lsh.bandResults.forEach(res => {
    if (res.match) collisionCount++;
    const card = document.createElement("div");
    card.className = `band-card ${res.match ? 'collision' : ''}`;
    card.innerHTML = `
      <div class="band-title">Band ${res.bandIndex}</div>
      <div class="band-hash">A: ${res.hashA}</div>
      <div class="band-hash">B: ${res.hashB}</div>
      <span class="band-badge ${res.match ? 'collision' : 'mismatch'}">
        ${res.match ? 'Collision' : 'Mismatch'}
      </span>
    `;
    grid.appendChild(card);
  });

  if (lsh.isCandidate) {
    statusDot.className = "lsh-status-indicator candidate";
    verdictTitle.innerText = `Candidate Pair Confirmed (${collisionCount} Colliding Bands)`;
    verdictDesc.innerText = `Locality Sensitive Hashing found matching buckets in ${collisionCount} band(s). The pair qualifies for fine-grained Jaccard evaluation, eliminating wasteful non-candidate checks!`;
  } else {
    statusDot.className = "lsh-status-indicator";
    verdictTitle.innerText = `Non-Candidate Pair (Zero Band Collisions)`;
    verdictDesc.innerText = `Signatures fell into completely separate buckets across all ${lsh.bandResults.length} bands. In a search engine corpus, this pair is discarded immediately without computing exact Jaccard.`;
  }
}

/* ========================================================
   Chart.js DSA Big-O Scalability Simulation
======================================================== */

function initScalabilityChart() {
  const ctx = document.getElementById("scalabilityChart");
  if (!ctx) return;

  const docCorpusSizes = [100, 500, 1000, 5000, 10000, 25000, 50000];
  
  // Brute force: N * (N - 1) / 2 comparisons -> O(N^2)
  const bruteForceOps = docCorpusSizes.map(n => (n * (n - 1)) / 2);
  
  // LSH: Average candidate checks with selective thresholding -> O(N) candidate inspections
  const lshOps = docCorpusSizes.map(n => Math.floor(n * 2.2));

  scalabilityChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: docCorpusSizes.map(n => `${(n / 1000).toFixed(0)}k docs`),
      datasets: [
        {
          label: 'Brute Force Pairwise Comparisons [O(n²)]',
          data: bruteForceOps,
          borderColor: '#EF4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          tension: 0.3,
          borderWidth: 2,
          pointRadius: 3
        },
        {
          label: 'MinHash + LSH Candidate Pair Checks [Sub-Quadratic]',
          data: lshOps,
          borderColor: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.15)',
          tension: 0.3,
          borderWidth: 2,
          pointRadius: 3
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          type: 'logarithmic',
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: {
            color: '#94A3B8',
            callback: function(val) {
              if (val === 1000000) return '1M ops';
              if (val === 1000000000) return '1B ops';
              if (val === 100000) return '100k ops';
              return '';
            }
          }
        },
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#94A3B8' }
        }
      },
      plugins: {
        legend: {
          labels: { color: '#F8FAFC', font: { size: 11 } }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return ` ${context.dataset.label}: ${context.raw.toLocaleString()} operations`;
            }
          }
        }
      }
    }
  });
}

/* ========================================================
   Algorithm Explorer Modal Data
======================================================== */

const ALGO_DETAILS = {
  preprocessing: {
    title: "1. Text Preprocessing & Tokenization",
    formula: "Normalized(T) = Lowercase(RegexFilter(T, [^a-z0-9]))",
    content: `
      <p>Unstructured natural language documents are saturated with punctuation, casing anomalies, escape sequences, and redundant whitespace that hinder duplicate detection.</p>
      <div class="modal-box">
        <strong>Preprocessing Algorithm:</strong>
        <ol>
          <li><strong>Case Folding:</strong> Maps all characters to standard lowercase (ASCII <code>[a-z]</code>).</li>
          <li><strong>Punctuation Stripping:</strong> Removes special symbols (<code>!?,.:;"'()</code>) to guarantee that "algorithm." and "algorithm" match.</li>
          <li><strong>Token Splitting:</strong> Tokenizes the continuous character array on whitespace boundaries into ordered discrete words.</li>
        </ol>
      </div>
      <p><strong>Complexity:</strong> <code>O(|Doc|)</code> linear time and space, where <code>|Doc|</code> is document character length.</p>
    `
  },
  shingling: {
    title: "2. K-Shingling (n-grams)",
    formula: "S_k(Doc) = { w_i, w_{i+1}, ..., w_{i+k-1} | 0 &le; i &le; |Doc| - k }",
    content: `
      <p>Rather than treating documents as a naive "bag of words" (which ignores sentence order completely), <strong>K-Shingling</strong> decomposes the document into a set of contiguous sub-sequences of length <code>k</code>.</p>
      <div class="modal-box">
        <strong>Why Shingling is Critical for Near-Duplicates:</strong>
        <ul>
          <li>If a document has a paragraph moved or a few words paraphrased, the vast majority of k-shingles remain completely identical.</li>
          <li>If <code>k</code> is too small (e.g. <code>k = 1</code>), almost all English documents share high overlap.</li>
          <li>If <code>k</code> is too large (e.g. <code>k = 10</code>), even minor edits disrupt all overlapping shingles.</li>
          <li>Recommended <code>k = 3</code> to <code>5</code> for standard paragraphs and news articles.</li>
        </ul>
      </div>
      <p><strong>Complexity:</strong> <code>O(n)</code> shingle generation time, producing at most <code>n - k + 1</code> shingles.</p>
    `
  },
  hashing: {
    title: "3. Polynomial Rolling Hashing",
    formula: "H(s) = \sum_{i=0}^{k-1} s[i] \cdot p^{k-1-i} \pmod{2^{32}}",
    content: `
      <p>Storing raw string shingles consumes extensive memory (tens of megabytes across thousands of files). Hashing maps variable-length string tokens to fixed 32-bit unsigned integers.</p>
      <div class="modal-box">
        <strong>Horner's Polynomial Hash Rule:</strong>
        <ul>
          <li>Using base prime <code>p = 31</code> and modulus <code>2^{32}</code> ensures low collision rates and uniform distribution.</li>
          <li>Enables <code>O(1)</code> constant space representation per shingle.</li>
          <li>Permits instantaneous bitwise and arithmetic transformations in downstream MinHash routines.</li>
        </ul>
      </div>
    `
  },
  jaccard: {
    title: "4. Jaccard Similarity Coefficient",
    formula: "J(A, B) = \frac{|A \cap B|}{|A \cup B|} = \frac{|A \cap B|}{|A| + |B| - |A \cap B|}",
    content: `
      <p>The Jaccard similarity coefficient is the canonical mathematical metric for evaluating the overlap of two finite sample sets.</p>
      <div class="modal-box">
        <strong>Key Properties:</strong>
        <ul>
          <li><strong>Range:</strong> Always bound strictly between <code>0.0</code> (completely disjoint sets) and <code>1.0</code> (identical sets).</li>
          <li><strong>Metric Distance:</strong> Jaccard Distance <code>d_J(A,B) = 1 - J(A,B)</code> satisfies triangle inequality.</li>
          <li><strong>The Scalability Bottleneck:</strong> Computing exact Jaccard requires pairwise set intersections. For <code>N</code> documents, this requires <code>N(N-1)/2 = O(N^2)</code> comparisons, making brute force intractable on web-scale datasets.</li>
        </ul>
      </div>
    `
  },
  minhash: {
    title: "5. MinHash Signatures (Dimension Reduction)",
    formula: "\Pr[\min h_i(A) = \min h_i(B)] = J(A, B)",
    content: `
      <p>Invented by Andrei Broder, <strong>MinHash</strong> compresses high-dimensional shingle sets into fixed compact vectors while mathematically preserving Jaccard similarity!</p>
      <div class="modal-box">
        <strong>The Fundamental MinHash Theorem:</strong>
        <p>If we pick a random permutation (hash function) <code>h</code>, the probability that the minimum hash value of set A equals the minimum hash value of set B is <em>exactly</em> the Jaccard similarity <code>J(A,B)</code>!</p>
        <strong>Vector Representation:</strong>
        <ul>
          <li>Instead of saving thousands of shingles, we store only <code>m</code> integers: <code>[h_1^{min}, h_2^{min}, ..., h_m^{min}]</code>.</li>
          <li>Estimated Jaccard similarity is simply the fraction of positions where both signatures match identically: <code>J_{est} = \frac{\text{Matches}}{m}</code>.</li>
        </ul>
      </div>
    `
  },
  lsh: {
    title: "6. Locality Sensitive Hashing (LSH)",
    formula: "\Pr[\text{Candidate}] = 1 - (1 - s^r)^b",
    content: `
      <p>MinHash reduces document size, but pairwise comparison of all signatures is still <code>O(N^2)</code>. <strong>LSH solves this final hurdle!</strong></p>
      <div class="modal-box">
        <strong>Banding Technique:</strong>
        <ol>
          <li>Divide the MinHash signature of length <code>m</code> into <code>b</code> bands of <code>r</code> rows each (such that <code>m = b \times r</code>).</li>
          <li>For each band, hash the <code>r</code> integers into a hash bucket table.</li>
          <li><strong>Candidate Rule:</strong> If two documents hash into the <em>same bucket in ANY band</em>, they are declared a <strong>Candidate Pair</strong>.</li>
        </ol>
        <strong>The S-Curve Magic:</strong>
        <p>This creates a sharp S-curve threshold <code>t \approx (1/b)^{1/r}</code>. Highly similar pairs collide with probability approaching 100%, while dissimilar pairs almost never collide, achieving sub-quadratic near-duplicate search!</p>
      </div>
    `
  }
};

function openAlgoModal(algoKey) {
  const algo = ALGO_DETAILS[algoKey];
  if (!algo) return;

  const modalBody = document.getElementById("modalBody");
  modalBody.innerHTML = `
    <h2 style="font-size: 1.6rem; margin-bottom: 8px;">${algo.title}</h2>
    <div style="margin-bottom: 16px;">
      <span class="math-badge" style="font-size: 0.95rem;">${algo.formula}</span>
    </div>
    <div style="color: var(--text-muted); line-height: 1.6;">
      ${algo.content}
    </div>
  `;

  document.getElementById("algoModal").classList.add("show");
}

function closeAlgoModal(event) {
  if (event && event.target !== document.getElementById("algoModal") && !event.target.classList.contains("modal-close")) {
    return;
  }
  document.getElementById("algoModal").classList.remove("show");
}

function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
