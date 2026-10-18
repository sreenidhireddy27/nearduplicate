# Near Duplicate Document Detection Framework
### Data Structures & Algorithms (DSA) College Project

A complete, interactive single-page web application demonstrating the end-to-end algorithmic pipeline for detecting near-duplicate textual documents in sub-quadratic time.

---

## 🌟 DSA Concepts Implemented
1. **Text Preprocessing & Normalization:** Case-folding, regex-based punctuation filtering, whitespace cleanup.
2. **K-Shingling (n-grams):** Dynamic token-level window generation ($k = 2, 3, 4, 5$).
3. **Polynomial Rolling Hashing:** 32-bit integer conversion via Horner's rule ($H(s) = \sum s[i] \cdot 31^{k-1-i} \pmod{2^{32}}$).
4. **Exact Jaccard Similarity:** Set cardinality metric ($J(A,B) = \frac{|A \cap B|}{|A \cup B|}$) with circular SVG progress meter.
5. **MinHash Signatures:** Dimensionality reduction via universal affine hash permutations ($(a \cdot x + b) \pmod p$) preserving Jaccard distance.
6. **Locality Sensitive Hashing (LSH):** Banding technique ($b$ bands of $r$ rows) and hash bucket collisions for candidate pair pruning.
7. **Big-$O$ Scalability Benchmark:** Side-by-side comparison of $O(n^2)$ pairwise brute-force vs. sub-quadratic LSH with interactive Chart.js logarithmic chart.
8. **Interactive Algorithm Explorer:** Modal breakdowns with formal equations and theoretical proofs.

---

## 🚀 How to Run
This project runs entirely on client-side vanilla web technologies:
- **No Node.js, npm, Python, or database required.**
- **No external paid API keys or backend server required.**

### Method 1: Direct Browser Launch
Simply double-click `index.html` to open it in Google Chrome, Microsoft Edge, Firefox, or Safari.

### Method 2: VS Code Live Server
1. Open the project folder in **Visual Studio Code**.
2. Install the **Live Server** extension (by Ritwick Dey).
3. Right-click `index.html` and select **"Open with Live Server"**.

---

## 📂 Project Structure
```
near-duplicate-detection-framework/
├── index.html        # Main application structure, inputs, visualizer, & modals
├── style.css         # Modern dark navy / glassmorphic UI with purple & blue accents
├── script.js         # Complete mathematical DSA algorithms & pipeline orchestration
└── README.md         # Documentation & college presentation guide
```

---

## 🎓 College Demonstration Guide for Professor Evaluation
When demonstrating this project to your professor or viva examiner:
1. **Load Benchmark Presets:**
   - Click **"Plagiarized Article (Near Duplicate)"** to show high similarity detection ($>80\%$).
   - Click **"Exact Identical Docs"** to demonstrate $100\%$ Jaccard overlap and full MinHash collision.
   - Click **"Completely Unrelated Topics"** to show LSH discarding non-candidates ($0\%$ collisions).
2. **Upload Custom `.txt` Files:**
   - Use the **Upload .txt** buttons on Document A and Document B to show real-time `FileReader` text processing.
3. **Step-by-Step Pipeline:**
   - Click **"Run Full Pipeline Analysis"** and highlight how each stage (01 to 07) transitions.
4. **Explain the Scalability Chart:**
   - Show the logarithmic chart comparing $O(n^2)$ vs. MinHash + LSH to explain why search engines (like Google) cannot do pairwise text comparison across billions of pages.
