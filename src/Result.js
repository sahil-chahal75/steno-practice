import React, { useEffect, useState } from 'react';
import { auth, db } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const Result = ({ result, doc, setView, setTestResult }) => {

  const [showOriginal, setShowOriginal] = useState(false);
  const [filterType, setFilterType] = useState(null);

  const originalText = doc?.text || "";
  const typedText = result || "";

  // ✅ NORMALIZATION
  const normalize = (word) => {
    if (!word) return "";
    let w = word.toLowerCase().replace(/[.,?!:;]/g, "");

    const map = {
      "%": "percent",
      "&": "and",
      "₹": "rupees",
      "rs": "rupees",
      "rupees": "rupees",
      "v/s": "vs",
      "vs": "vs",
      "versus": "vs",
      "u/s": "undersection"
    };

    return map[w] || w;
  };

  // ✅ DATE CHECK
  const isDate = (str) => /\d{1,2}([\/.\-])\d{1,2}\1\d{2,4}/.test(str);

  // ✅ HALF MISTAKE
  const isHalfMistake = (a, b) => {
    if (!a || !b) return false;

    if (a + 's' === b || a === b + 's') return true;
    if (a + 'es' === b || a === b + 'es') return true;

    if (a.replace(/man/g, 'men') === b || a.replace(/men/g, 'man') === b) return true;

    const pairs = [['then','than'], ['their','there'], ['its',"it's"]];
    return pairs.some(p => p.includes(a) && p.includes(b));
  };

  // ✅ MAIN CALCULATION (ANTI-CHAIN ENGINE)
  const calculateResult = () => {

    if (!originalText) return null;

    const oriArr = originalText.trim().split(/\s+/);
    const typArr = typedText.trim().split(/\s+/);

    let report = [];
    let fullMistakes = 0;
    let halfMistakes = 0;

    let i = 0, j = 0;

    while (i < oriArr.length || j < typArr.length) {

      let ori = oriArr[i];
      let typ = typArr[j];

      let o = normalize(ori);
      let t = normalize(typ);

      // DATE IGNORE
      if (isDate(ori) && isDate(typ)) {
        report.push({ type: 'correct', word: typ });
        i++; j++; continue;
      }

      // EXACT
      if (o === t) {
        report.push({ type: 'correct', word: typ });
        i++; j++; continue;
      }

      // HALF
      if (isHalfMistake(o, t)) {
        report.push({ type: 'half', word: typ, original: ori });
        halfMistakes++;
        i++; j++; continue;
      }

      let nextOri = normalize(oriArr[i + 1]);
      let nextTyp = normalize(typArr[j + 1]);

      // MISSING
      if (nextOri === t) {
        report.push({ type: 'missing', word: `(${ori})` });
        fullMistakes++;
        i++; continue;
      }

      // EXTRA
      if (o === nextTyp) {
        report.push({ type: 'extra', word: typ });
        fullMistakes++;
        j++; continue;
      }

      // WRONG (ONLY ONCE)
      if (ori && typ) {
        report.push({ type: 'wrong', word: typ, original: ori });
        fullMistakes++;
        i++; j++; continue;
      }

      if (ori) {
        report.push({ type: 'missing', word: `(${ori})` });
        fullMistakes++;
        i++; continue;
      }

      if (typ) {
        report.push({ type: 'extra', word: typ });
        fullMistakes++;
        j++; continue;
      }
    }

    // FULL STOP SPACE RULE
    const extraSpaceErrors = (typedText.match(/\w+\s+\./g) || []).length;
    fullMistakes += extraSpaceErrors;

    const totalErrors = fullMistakes + (halfMistakes * 0.5);
    const errorPercent = ((totalErrors / oriArr.length) * 100).toFixed(2);

    const isQualified = parseFloat(errorPercent) <= (doc?.errorLimit || 5);

    return {
      report,
      fullMistakes,
      halfMistakes,
      totalErrors,
      errorPercent,
      isQualified,
      totalWords: oriArr.length,
      typedWords: typArr.length
    };
  };

  const data = calculateResult();

  // ✅ SAVE RESULT (SAFE)
  useEffect(() => {
    const save = async () => {
      const user = auth.currentUser;
      if (user && data && doc?.title) {
        try {
          await addDoc(collection(db, "results"), {
            userId: user.uid,
            userName: user.displayName || "Student",
            exerciseTitle: doc.title,
            fullMistakes: data.fullMistakes,
            halfMistakes: data.halfMistakes,
            errorPercent: data.errorPercent,
            status: data.isQualified ? 'QUALIFIED' : 'DISQUALIFIED',
            createdAt: serverTimestamp()
          });
        } catch (e) {
          console.error(e);
        }
      }
    };
    save();
  }, [data, doc]);

  if (!data) return <div>Loading...</div>;

  const filtered = data.report.filter(r => {
    if (filterType === 'full') return ['wrong','missing','extra'].includes(r.type);
    if (filterType === 'half') return r.type === 'half';
    return false;
  });

  return (
    <div className="p-4 max-w-4xl mx-auto">

      <h2 className={`text-2xl font-bold text-center ${data.isQualified ? 'text-green-600':'text-red-600'}`}>
        {data.isQualified ? 'QUALIFIED ✅' : 'DISQUALIFIED ❌'}
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 my-4">
        <div>Original: {data.totalWords}</div>
        <div>Typed: {data.typedWords}</div>
        <div>Error %: {data.errorPercent}</div>
        <div>Full: {data.fullMistakes}</div>
        <div>Half: {data.halfMistakes}</div>
      </div>

      <div className="flex gap-3 mb-4">
        <button onClick={()=>setFilterType('full')}>Full Mistakes</button>
        <button onClick={()=>setFilterType('half')}>Half Mistakes</button>
        <button onClick={()=>setShowOriginal(!showOriginal)}>Original</button>
      </div>

      {filterType && (
        <div className="p-3 border">
          {filtered.map((w,i)=>(
            <span key={i} className="mr-2">
              {w.word} {w.original && `(${w.original})`}
            </span>
          ))}
        </div>
      )}

      {showOriginal && (
        <div className="p-3 border mt-3">
          {originalText}
        </div>
      )}

      <div className="mt-4 leading-8">
        {data.report.map((w,i)=>(
          <span key={i} className="mr-2">
            {w.type==='correct' && <span className="text-green-600">{w.word}</span>}
            {w.type==='wrong' && <span className="text-red-600">{w.word}</span>}
            {w.type==='half' && <span className="text-orange-600">{w.word}</span>}
            {w.type==='missing' && <span className="bg-gray-200">{w.word}</span>}
            {w.type==='extra' && <span className="text-blue-600">{w.word}</span>}
          </span>
        ))}
      </div>

    </div>
  );
};

export default Result;
