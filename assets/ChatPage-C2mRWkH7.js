import{c as ee,G as le,H as de,J as te,K as pe,E as ue,a as he,i as me,r as y,j as s,A as fe,m as A,N as C}from"./index-DKDvxMrN.js";import{f as ye,a as xe}from"./weather-Dk-SerBm.js";import{H,Z}from"./zap-kvSG0iOy.js";import{A as ge}from"./arrow-right-D2dmaZ-q.js";const be=[["path",{d:"M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z",key:"1ffxy3"}],["path",{d:"m21.854 2.147-10.94 10.939",key:"12cjpa"}]],we=ee("send",be);const Ae=[["path",{d:"M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z",key:"1s2grr"}],["path",{d:"M20 2v4",key:"1rf3ol"}],["path",{d:"M22 4h-4",key:"gwowj6"}],["circle",{cx:"4",cy:"20",r:"2",key:"6kqj1y"}]],Te=ee("sparkles",Ae),N="מוטי",U='יועץ טיולים ציני (מופעל ע"י AI)',L={טיסות:"flights",טיסה:"flights",לינה:"accommodation",מלון:"accommodation",אירוח:"accommodation",אוכל:"food",מזון:"food",תחבורה:"transport",הסעות:"transport",רכב:"transport",אטרקציות:"attractions",כרטיסים:"attractions",קניות:"shopping",שופינג:"shopping",תקשורת:"communication",סים:"communication",ביטוח:"insurance",אחר:"other"},O={};for(const[t,e]of Object.entries(L))O[e]||(O[e]=t);for(const[t,{label:e}]of Object.entries(ue))O[t]=e;const k={};for(let t=1;t<=20;t++)k[`יום ${t}`]=`day-${t}`,k[`day ${t}`]=`day-${t}`,k[`${t}`]=`day-${t}`;function De(t){const e=t.match(/(\d[\d,]*)/g);if(!e)return null;for(let n=e.length-1;n>=0;n--){const r=Number(e[n].replace(/,/g,""));if(r>0)return r}return null}function Ee(t){const e=t.toLowerCase();for(const[n,r]of Object.entries(L))if(e.includes(n))return r;return null}function q(t){const e=t.toLowerCase();for(const[r,a]of Object.entries(k))if(e.includes(r))return a;const n=e.match(/(\d{1,2})\s*(בספט|ספט|\/9|\.9)/);if(n){const a=Number(n[1])-10;if(a>=1&&a<=20)return`day-${a}`}return null}function Ie(t){const e=t.trim(),n=[],r=[/(?:תעדכן|עדכן|שנה|תשנה|הגדר|תגדיר|קבע|תקבע)\s.*?תקציב\s.*?(?:ה)?(טיסות|טיסה|לינה|מלון|אירוח|אוכל|מזון|תחבורה|הסעות|רכב|אטרקציות|כרטיסים|קניות|שופינג|תקשורת|סים|ביטוח|אחר)\s.*?(?:ל[-\s]?)?(\d[\d,]*)/,/(?:תעדכן|עדכן|שנה|תשנה|הגדר|תגדיר|קבע|תקבע)\s.*?(?:ה)?(טיסות|טיסה|לינה|מלון|אירוח|אוכל|מזון|תחבורה|הסעות|רכב|אטרקציות|כרטיסים|קניות|שופינג|תקשורת|סים|ביטוח|אחר)\s.*?(?:ל[-\s]?)?(\d[\d,]*)/,/תקציב\s+(?:ה)?(טיסות|טיסה|לינה|מלון|אירוח|אוכל|מזון|תחבורה|הסעות|רכב|אטרקציות|כרטיסים|קניות|שופינג|תקשורת|סים|ביטוח|אחר)\s.*?(?:ל[-\s]?)?(\d[\d,]*)/,/(?:ה)?(טיסות|טיסה|לינה|מלון|אירוח|אוכל|מזון|תחבורה|הסעות|רכב|אטרקציות|כרטיסים|קניות|שופינג|תקשורת|סים|ביטוח|אחר)\s.*?תקציב\s.*?(?:ל[-\s]?)?(\d[\d,]*)/];for(const c of r){const m=e.match(c);if(m){const f=L[m[1]],_=Number(m[2].replace(/,/g,""));if(f&&_>0)return n.push({type:"UPDATE_BUDGET_CATEGORY",category:f,amount:_}),n}}const a=e.match(/(?:תעדכן|עדכן|שנה|תשנה|הגדר|תגדיר|קבע|תקבע)\s.*?תקציב\s+(?:ה)?כולל\s.*?(?:ל[-\s]?)?(\d[\d,]*)/);if(a){const c=Number(a[1].replace(/,/g,""));if(c>0)return n.push({type:"UPDATE_TOTAL_BUDGET",amount:c}),n}const o=e.match(/(?:תעדכן|עדכן|שנה|תשנה|הגדר|תגדיר|קבע|תקבע)\s.*?תקציב\s+(?:ה)?יומי\s.*?(?:ל[-\s]?)?(\d[\d,]*)/);if(o){const c=Number(o[1].replace(/,/g,""));if(c>0)return n.push({type:"UPDATE_DAILY_BUDGET",amount:c}),n}if(/(?:תעדכן|עדכן|שנה|תשנה|הגדר|תגדיר|קבע|תקבע)/.test(e)){const c=Ee(e),m=De(e);if(c&&m&&m>0)return n.push({type:"UPDATE_BUDGET_CATEGORY",category:c,amount:m}),n}if(e.match(/(?:תוסיף|הוסף|תכניס|הכנס)\s+(?:עצירה|תחנה|פעילות|אטרקציה)\s+(?:ב)?(יום\s+\d+|\d{1,2}\s*בספט)/)){const c=q(e);if(c){const f=(e.split(/יום\s+\d+|\d{1,2}\s*בספט/)[1]||"").replace(/^[\s:—\-]+/,"").trim()||"עצירה חדשה";return n.push({type:"ADD_ITINERARY_STOP",dayId:c,stop:{title:f,category:"activity"}}),n}}if(e.match(/(?:תוסיף|הוסף|תעדכן|עדכן)\s+(?:הערה|הערות|פתק)\s+(?:ל|ב)?(יום\s+\d+|\d{1,2}\s*בספט)/)){const c=q(e);if(c){const f=(e.split(/יום\s+\d+|\d{1,2}\s*בספט/)[1]||"").replace(/^[\s:—\-]+/,"").trim()||"";if(f)return n.push({type:"UPDATE_ITINERARY_DAY_NOTES",dayId:c,notes:f}),n}}return n}let w=[],I="",$="";const S=15;async function K(){try{ye().then(a=>{$=xe(a)}).catch(()=>{});const t=await le();I=t.summary||"",w=(await de(S)).map(a=>({role:a.role,content:a.content}));const n=await te(1e3),r=n.length;if(r>t.message_count+10&&r>S){const a=n.slice(0,Math.max(0,r-S));a.length>0&&se()&&Se(a,r).catch(()=>{})}}catch(t){console.warn("[Moti] Failed to load conversation from DB:",t)}}async function Se(t,e){try{const n="https://lsmqhowvmqwgztpnshbc.supabase.co",r="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzbXFob3d2bXF3Z3p0cG5zaGJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0Mjg1ODEsImV4cCI6MjA4OTAwNDU4MX0.7uut7czVyIP7c3LVn8fJncXkNJPU9cTea2nS0dOmS6E",a=await fetch(`${n}/functions/v1/moti-chat`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${r}`,apikey:r},body:JSON.stringify({messages:[{role:"user",content:`סכם את השיחה הבאה ב-3-4 משפטים קצרים בעברית. התמקד בנושאים העיקריים, החלטות שהתקבלו, ובקשות חוזרות. אל תכלול פרטי שיחה טכניים.

שיחה:
${t.map(d=>`${d.role==="user"?"משתמש":"מוטי"}: ${d.content.slice(0,200)}`).join(`
`)}`}],summarize:!0})}),o=a.ok?await a.json():null;o?.text&&(I=o.text,await pe(o.text,e))}catch{console.warn("[Moti] Failed to generate memory summary")}}const _e=new Set(["UPDATE_BUDGET_CATEGORY","UPDATE_TOTAL_BUDGET","UPDATE_DAILY_BUDGET","ADD_EXPENSE","ADD_ITINERARY_STOP","UPDATE_ITINERARY_DAY_NOTES"]),Q=new Set(["flights","accommodation","food","transport","attractions","shopping","communication","insurance","other"]),je=new Set(["aba","ima","kid1","kid2","kid3"]);function Ne(t){if(!Array.isArray(t)||t.length===0)return[];const e=[];for(const n of t){if(!n||typeof n!="object"||!("type"in n))continue;const r=n;if(_e.has(r.type))switch(r.type){case"UPDATE_BUDGET_CATEGORY":{const a=String(r.category||""),o=Number(r.amount);Q.has(a)&&o>0&&o<1e6&&e.push({type:"UPDATE_BUDGET_CATEGORY",category:a,amount:o});break}case"UPDATE_TOTAL_BUDGET":{const a=Number(r.amount);a>0&&a<1e7&&e.push({type:"UPDATE_TOTAL_BUDGET",amount:a});break}case"UPDATE_DAILY_BUDGET":{const a=Number(r.amount);a>0&&a<1e6&&e.push({type:"UPDATE_DAILY_BUDGET",amount:a});break}case"ADD_EXPENSE":{const a=r.expense;if(!a||typeof a!="object")break;const o=String(a.title||""),d=Number(a.amount),p=String(a.category||"other"),c=String(a.paid_by||"aba");o&&d>0&&d<1e6&&Q.has(p)&&je.has(c)&&e.push({type:"ADD_EXPENSE",expense:{title:o,amount:d,currency:String(a.currency||"₪"),category:p,paid_by:c,date:String(a.date||new Date().toISOString().split("T")[0])}});break}case"ADD_ITINERARY_STOP":{const a=String(r.dayId||""),o=r.stop;if(!o||typeof o!="object")break;const d=String(o.title||"");/^day-\d{1,2}$/.test(a)&&d&&e.push({type:"ADD_ITINERARY_STOP",dayId:a,stop:{title:d,description:o.description?String(o.description):void 0,location:o.location?String(o.location):void 0,start_time:o.start_time?String(o.start_time):void 0,end_time:o.end_time?String(o.end_time):void 0,category:o.category?String(o.category):"activity",notes:o.notes?String(o.notes):void 0}});break}case"UPDATE_ITINERARY_DAY_NOTES":{const a=String(r.dayId||""),o=String(r.notes||"");/^day-\d{1,2}$/.test(a)&&o&&e.push({type:"UPDATE_ITINERARY_DAY_NOTES",dayId:a,notes:o});break}}}return e}async function ke(t){const e=Ie(t);if(w.push({role:"user",content:t}),w.length>S&&(w=w.slice(-S)),e.length>0){const o=$e(e);return w.push({role:"assistant",content:o}),{text:o,actions:e}}const n="https://lsmqhowvmqwgztpnshbc.supabase.co",r="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzbXFob3d2bXF3Z3p0cG5zaGJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0Mjg1ODEsImV4cCI6MjA4OTAwNDU4MX0.7uut7czVyIP7c3LVn8fJncXkNJPU9cTea2nS0dOmS6E";try{const o=[...w];if(I||$){const p=[];I&&p.push(`[זיכרון משיחות קודמות: ${I}]`),$&&p.push(`[${$}]`),o.unshift({role:"user",content:p.join(`

`)},{role:"assistant",content:"תודה, אני מעודכן. במה אפשר לעזור?"})}const d=await fetch(`${n}/functions/v1/moti-chat`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${r}`,apikey:r},body:JSON.stringify({messages:o})});if(d.ok){const p=await d.json();if(p?.text){const c=p.text;w.push({role:"assistant",content:c});const m=Ne(p.actions),f=e.length>0?e:m;return{text:c,actions:f}}}console.warn("AI request failed with status:",d.status)}catch(o){console.warn("AI request failed, falling back to keywords:",o)}const a=Ce(t);return w.push({role:"assistant",content:a}),{text:a,actions:[]}}function $e(t){const e=[];for(const n of t)switch(n.type){case"UPDATE_BUDGET_CATEGORY":{const r=O[n.category]||n.category;e.push(`בוצע! עדכנתי את תקציב **${r}** ל-**₪${n.amount.toLocaleString()}**. ✅

תבדקו בעמוד התקציב — הכל מעודכן שם.`);break}case"UPDATE_TOTAL_BUDGET":e.push(`בוצע! עדכנתי את **התקציב הכולל** ל-**₪${n.amount.toLocaleString()}**. ✅

מקווה שמצאתם עוד כסף מתחת לספה.`);break;case"UPDATE_DAILY_BUDGET":e.push(`בוצע! עדכנתי את **התקציב היומי** ל-**₪${n.amount.toLocaleString()}**. ✅`);break;case"ADD_EXPENSE":e.push(`בוצע! הוספתי הוצאה חדשה: **${n.expense.title}** בסך **₪${n.expense.amount.toLocaleString()}**. ✅`);break;case"UPDATE_ITINERARY_DAY_NOTES":e.push(`בוצע! עדכנתי את ההערות ל-**${n.dayId.replace("day-","יום ")}**. ✅

תבדקו בלוח הזמנים.`);break;case"ADD_ITINERARY_STOP":e.push(`בוצע! הוספתי עצירה חדשה ל-**${n.dayId.replace("day-","יום ")}**: **${n.stop.title}**. ✅

תבדקו בלוח הזמנים — הכל מעודכן.`);break}return e.join(`

`)+`

עוד משהו לעדכן? אני פה. 😏`}const l={dates:"11-30 בספטמבר 2026",duration:"20 יום",route:"תל אביב → לוס אנג'לס → דיסנילנד → לאס וגאס → גרנד קניון → זאיון → יוסמיטי → סן פרנסיסקו → תל אביב",flights:{outbound:"El Al LY001, TLV→LAX, 11 בספטמבר 2026",return:"SFO→TLV, 30 בספטמבר 2026"},rv:"Cruise America Class C, איסוף LAX 12/9, החזרה SFO 28/9",family:"5 בני משפחה: אבא, אמא, ילד 1, ילד 2, ילד 3",budget:{total:"50,000 ₪",flights:"14,000 ₪",accommodation:"12,000 ₪",food:"6,000 ₪",transport:"5,000 ₪",attractions:"5,000 ₪",shopping:"4,000 ₪",insurance:"2,000 ₪",daily:"2,500 ₪"}},Oe=["אוקיי, שאלת את מוטי — אז תקבל את האמת.","טוב, בוא נדבר תכלס.","אהה, שאלה מעולה. ואני אומר את זה בלי אירוניה. טוב, אולי קצת.","שנייה, מסדר את המשקפיים של היועץ...","מוטי פה. יאללה, לעניין.","אוף, חשבתי שלא תשאלו לעולם."],Me=["עוד שאלות? אני פה, לא שיש לי ברירה. 😏","תודו שאני שווה כל שקל. אה רגע, אני בחינם.","בבקשה, בלי תשלום. הפעם.","מוטי לשירותכם. 24/7. כי אין לי חיים."];function R(t){return t[Math.floor(Math.random()*t.length)]}function h(t){return`${R(Oe)}

${t}

${R(Me)}`}const ve=[{keywords:["ביטוח","insurance"],response:()=>h(`ביטוח נסיעות — תזמינו **לפחות חודש לפני** הטיסה. יש לכם תקציב של ${l.budget.insurance} לביטוח.

כמה טיפים ממוטי:
• קנו ביטוח עם כיסוי רפואי של לפחות $1M — אמריקה זו לא קופת חולים
• וודאו שהביטוח מכסה פעילות אתגרית (הייקינג בגרנד קניון זה לא טיול בפארק הירקון)
• שמרו את הפוליסה בנייד + עותק מודפס
• שימו לב שהביטוח מכסה את כל 5 בני המשפחה

💡 *רוצים לעדכן את תקציב הביטוח? כתבו: "עדכן תקציב ביטוח ל-3000"*`)},{keywords:["תקציב","כסף","budget","עלות","מחיר"],response:()=>h(`התקציב הכולל: **${l.budget.total}**

הנה הפירוט (תחזיקו חזק):
✈️ טיסות: ${l.budget.flights}
🏨 לינה: ${l.budget.accommodation}
🍔 אוכל: ${l.budget.food}
🚗 תחבורה: ${l.budget.transport}
🎢 אטרקציות: ${l.budget.attractions}
🛍️ קניות: ${l.budget.shopping}
🛡️ ביטוח: ${l.budget.insurance}

תקציב יומי: **${l.budget.daily}**. כלומר, תשכחו מסטייקים כל ערב. אבל In-N-Out Burger? חובה.

💡 *רוצים לשנות? כתבו למשל: "עדכן תקציב ביטוח ל-3000" או "שנה תקציב כולל ל-60000"*`)},{keywords:["טיסה","טיסות","flight","לטוס","שדה תעופה"],response:()=>h(`פרטי הטיסות שלכם:

**הלוך:** ${l.flights.outbound}
**חזור:** ${l.flights.return}

טיפ ממוטי: תגיעו 3 שעות לפני לנתב"ג. כן, אני יודע שכולם אומרים את זה. אבל עם 5 בני משפחה? תגיעו 4.

וגם: הזמינו מושבים מראש אם לא עשיתם. 5 אנשים מפוזרים במטוס = ילדים שמפריעים לזרים = הורים מתים מבושה.`)},{keywords:["קרוואן","rv","נהיגה","רכב"],response:()=>h(`הקרוואן: **${l.rv}**

כמה דברים חשובים:
• צריך **רישיון נהיגה בינלאומי** — זה במשימות שלכם, מקווה שטיפלתם
• Class C זה קרוואן על בסיס משאית — לא קטן, לא ענק, בדיוק מספיק ל-5
• תדלקו לפני שהמחוג מגיע לרבע — בגרנד קניון אין תחנת דלק בכל פינה
• נהיגה בצד ימין, לא שמאל. כן, אני צריך לומר את זה.`)},{keywords:["דיסנילנד","דיסני","disney"],response:()=>h(`דיסנילנד! הילדים ישתגעו (וההורים יישברו כלכלית, אבל שווה).

טיפים ממוטי הציני:
• הזמינו כרטיסים **מראש** — כבר יש לכם את זה במשימות
• תורידו את אפליקציית דיסנילנד — לתור חכם ולמפה
• הגיעו **לפתיחה** — השעה הראשונה שווה שלוש אחר הצהריים
• קחו בקבוקי מים ריקים (יש מילוי בחינם בפארק)
• תקציב אוכל בפארק: תוסיפו 30% על מה שחשבתם. רציני.`)},{keywords:["גרנד קניון","grand canyon","קניון"],response:()=>h(`גרנד קניון — **15 בספטמבר**.

זה אחד מהמקומות האלה שאתה מגיע ופתאום מבין כמה אתה קטן. ציני כמוני? גם אני הייתי בשוק.

טיפים:
• South Rim — הגישה הקלאסית, מתאימה למשפחה
• **מים מים מים** — ספטמבר עדיין חם שם, 30+ מעלות
• אל תנסו לרדת לתחתית ולחזור באותו יום עם ילדים. סתם לא.
• שקיעה מ-Mather Point = הרגע הכי שווה בטיול`)},{keywords:["יוסמיטי","yosemite"],response:()=>h(`יוסמיטי — **18-20 בספטמבר** (3 ימים!).

שלושה ימים ביוסמיטי זה מושלם. בניגוד לרוב ההחלטות שלכם (צחוק, צחוק).

חובה:
• Half Dome View מ-Glacier Point
• Yosemite Falls Trail (הייק קל יחסית, מתאים לילדים)
• Tunnel View — העצירה הראשונה, הכי מצולמת

שימו לב: ספטמבר = פחות מפלים (סוף הקיץ), אבל פחות המוני אנשים. Win.`)},{keywords:["זאיון","zion"],response:()=>h(`זאיון — **16 בספטמבר**.

Angels Landing? עם ילדים? אממ... Narrows יותר בטוח ומדהים.

• The Narrows = הליכה בתוך הנהר, בין קירות סלע ענקיים. הילדים יאהבו.
• קחו נעלי מים (או שכרו ציוד בכניסה לפארק)
• Emerald Pools Trail — קל, יפה, לכל המשפחה
• השאטל בתוך הפארק חינמי — אל תנסו להיכנס ברכב`)},{keywords:["וגאס","vegas","לאס וגאס"],response:()=>h(`לאס וגאס עם ילדים. כן, אנשים עושים את זה. לא, זה לא מוזר. (קצת מוזר.)

אטרקציות למשפחה:
• High Roller — הגלגל הכי גדול בעולם, נוף מטורף
• Shark Reef ב-Mandalay Bay
• ה-Strip בלילה — פשוט ללכת ולהסתכל (חינם!)
• Bellagio Fountains — מופע מים חינמי שגורם לילדים לפעור פה

יש לכם מלון שם כבר, אז לפחות את זה סגרתם. 👏`)},{keywords:["אריזה","packing","לארוז","מזוודה"],response:()=>h(`אריזה ל-20 יום עם 5 בני משפחה. בהצלחה.

הדברים שאנשים **תמיד** שוכחים:
• מתאם חשמל לארה"ב (Type A/B — אלה עם שני פינים שטוחים)
• תרופות מרשם + צילום המרשם באנגלית
• קרם הגנה SPF50+ (ספטמבר במדבר = שמש רצחנית)
• בגדי שכבות — יוסמיטי בלילה קר, וגאס ביום רותח
• נעלי הייקינג מנוסות (לא חדשות! שבירה של נעלים בגרנד קניון = סיוט)

יש לכם רשימת אריזה מלאה במודול האריזה. תשתמשו בה. בבקשה.`)},{keywords:["מסמכים","דרכון","visa","esta","ויזה"],response:()=>h(`מסמכים — הדבר הכי משעמם והכי חשוב:

✅ 5 דרכונים — וודאו שתקפים לפחות 6 חודשים אחרי 30/9/2026
✅ ESTA — צריך לכל 5 בני המשפחה, גם הילדים
✅ ביטוח נסיעות
✅ רישיון נהיגה בינלאומי (לקרוואן!)
✅ אישורי הזמנות (טיסות, קרוואן, מלונות, דיסנילנד)

טיפ: תשמרו הכל גם בענן וגם מודפס. כי WiFi בגרנד קניון? 😂`)},{keywords:["מתי","לוח זמנים","תאריך","מסלול","route","itinerary"],response:()=>h(`המסלול המלא:

📅 **${l.dates}** (${l.duration})

${l.route}

**תחנות עיקריות:**
• 11/9 — נחיתה ב-LAX
• 12/9 — איסוף קרוואן + לוס אנג'לס
• דיסנילנד
• לאס וגאס
• 15/9 — גרנד קניון
• 16/9 — זאיון
• 18-20/9 — יוסמיטי
• 28/9 — החזרת קרוואן בסן פרנסיסקו
• 28-30/9 — סן פרנסיסקו (מלון)
• 30/9 — טיסה הביתה מ-SFO

20 יום. 5 בני משפחה. קרוואן אחד. מה יכול להשתבש? 😄

💡 *רוצים להוסיף עצירה? כתבו: "תוסיף עצירה ביום 5: ביקור במוזיאון"*`)},{keywords:["אוכל","מסעדה","לאכול","food","restaurant"],response:()=>h(`אוכל בארה"ב! תקציב: **${l.budget.food}** לכל הטיול.

המלצות ממוטי (שאכל כל מה שאפשר):
• **In-N-Out Burger** — חובה ביום הראשון. Double-Double, Animal Style. תודו לי.
• **Trader Joe's** — סופר מעולה לקניות לקרוואן, חוסך המון
• **Costco** — חברות יומית ב-$5, שווה לקניית מים וחטיפים בכמויות
• סן פרנסיסקו: Clam Chowder ב-Fisherman's Wharf
• וגאס: Buffet — הילדים יאכלו ב-$15-20 ואתם תוציאו את הכסף

עם קרוואן, בשלו לעצמכם ארוחות בוקר וצהריים. מסעדות רק בערב = שורדים בתקציב.`)},{keywords:["san francisco","סן פרנסיסקו","sf"],response:()=>h(`סן פרנסיסקו — הסיום המושלם! **28-30 בספטמבר** (מלון).

אחרי 16 יום בקרוואן, מלון ירגיש כמו ארמון.

חובה:
• Golden Gate Bridge (הפתעה, נכון?)
• Fisherman's Wharf + Pier 39 (כלבי ים!)
• כבל קאר — הילדים ישתגעו
• Alcatraz — אם הזמנתם מראש (מומלץ!)
• Ghirardelli Square — שוקולד חינמי בחנות

וה-Fog? זה לא ערפל, זה אווירה. 😎`)},{keywords:["עזרה","help","מה אתה","מי אתה"],response:()=>`אני **מוטי** 🤖 — יועץ הטיולים הציני שלכם, מופעל על ידי AI.

אני מכיר את הטיול שלכם בע"פ: ${l.dates}, ${l.family}, מסלול מלא ברחבי ארה"ב.

תשאלו אותי על:
• ✈️ טיסות ומסלול
• 🚐 קרוואן ונהיגה
• 💰 תקציב
• 📋 ביטוח ומסמכים
• 🏞️ פארקים לאומיים
• 🎢 דיסנילנד ואטרקציות
• 🧳 אריזה
• 🍔 אוכל
• או **כל שאלה אחרת** — אני AI, אני יודע הכל! (כמעט.)

🔧 **חדש! אני יכול גם לשנות דברים באתר:**
• "עדכן תקציב ביטוח ל-3000"
• "שנה תקציב כולל ל-60000"
• "תוסיף עצירה ביום 5: ביקור במוזיאון"
• "תוסיף הערה ליום 3: לקחת מים"

ציני אבל מדויק. ולפחות לא משעמם. 😏`}],Pe=[`שאלה מעניינת, אבל מוטי במצב אופליין כרגע ולא מחובר ל-AI. 🔌

נסו לשאול על משהו ספציפי — טיסות, ביטוח, תקציב, אריזה, או כל מקום במסלול!

או פשוט תכתבו "עזרה" ואני אראה לכם מה אני יודע.`,`אממ... מוטי לא מחובר ל-AI כרגע, אז אני עובד במצב בסיסי. 🤖

אני מומחה לטיול שלכם לארה"ב — שאלו אותי על המסלול, התקציב, המסמכים, או כל אטרקציה ספציפית!`,`לא הבנתי, אבל אל תיקחו את זה אישית — אני במצב אופליין. 😅

שאלו על הטיול: ביטוח? דיסנילנד? גרנד קניון? אריזה? תקציב? אני פה!`];function Ce(t){const e=t.toLowerCase().trim();if(/^(היי|הי|שלום|בוקר|ערב|מה נשמע|אהלן|hey|hi|hello)/.test(e))return`שלום שלום! 👋 אני מוטי, היועץ הציני שלכם לטיול לארה"ב.

מה רוצים לדעת? יש לי דעה על הכל — ביטוח, תקציב, דיסנילנד, גרנד קניון... רק תשאלו.

🔧 **חידוש:** אני יכול גם לעדכן דברים באתר! נסו: "עדכן תקציב ביטוח ל-3000"`;for(const n of ve)if(n.keywords.some(a=>e.includes(a)))return n.response();return R(Pe)}function se(){return!0}function Ue(t){const e=[];return e.push("עדכן תקציב ביטוח ל-3000"),t.daysUntilTrip>60?e.push("מה הדבר הכי חשוב לסגור עכשיו?"):t.daysUntilTrip>14?e.push("מה עוד חסר לנו לפני הטיול?"):t.daysUntilTrip<=14&&e.push("תעשה לי רשימת last minute!"),t.packingPercent<50&&e.push("עזור לי עם רשימת האריזה"),t.budgetPercent>70&&e.push("איפה אפשר לחסוך בתקציב?"),t.tasksDone<t.tasksTotal&&e.push(`נשארו ${t.tasksTotal-t.tasksDone} משימות, מה הכי דחוף?`),e.push("תכנן לי יום מושלם ביוסמיטי"),e.push("מה המסלול המלא?"),e.push("תוסיף עצירה ביום 5: ביקור במוזיאון"),[...new Set(e)].slice(0,6)}function Re({size:t=24}){return s.jsxs("svg",{viewBox:"0 0 64 64",width:t,height:t,fill:"none",xmlns:"http://www.w3.org/2000/svg",children:[s.jsx("ellipse",{cx:"32",cy:"50",rx:"10",ry:"8",fill:"#FFD93D"}),s.jsx("rect",{x:"30",y:"40",width:"4",height:"5",rx:"2",fill:"#FFD93D"}),s.jsx("circle",{cx:"32",cy:"28",r:"16",fill:"#FFE066"}),s.jsxs(A.g,{animate:{scaleY:[1,.1,1]},transition:{duration:.15,repeat:1/0,repeatDelay:4,ease:"easeInOut"},children:[s.jsx("circle",{cx:"26",cy:"26",r:"2.5",fill:"#1d1d1f"}),s.jsx("circle",{cx:"38",cy:"26",r:"2.5",fill:"#1d1d1f"})]}),s.jsx("circle",{cx:"27",cy:"25",r:"0.8",fill:"white"}),s.jsx("circle",{cx:"39",cy:"25",r:"0.8",fill:"white"}),s.jsx("path",{d:"M25 33 Q32 39 39 33",stroke:"#1d1d1f",strokeWidth:"1.8",strokeLinecap:"round",fill:"none"}),s.jsx("circle",{cx:"21",cy:"31",r:"2.5",fill:"#FFB5B5",opacity:"0.5"}),s.jsx("circle",{cx:"43",cy:"31",r:"2.5",fill:"#FFB5B5",opacity:"0.5"}),s.jsx(A.g,{animate:{rotate:[0,15,-5,15,0]},transition:{duration:1.2,repeat:1/0,repeatDelay:3,ease:"easeInOut"},style:{transformOrigin:"44px 48px"},children:s.jsx("circle",{cx:"46",cy:"44",r:"3.5",fill:"#FFD93D"})}),s.jsx("circle",{cx:"18",cy:"46",r:"3.5",fill:"#FFD93D"})]})}function B({size:t="md"}){const e=t==="sm"?"h-8 w-8":"h-10 w-10",n=t==="sm"?28:34;return s.jsx(A.div,{animate:{y:[0,-2,0]},transition:{duration:2.5,repeat:1/0,ease:"easeInOut"},className:`${e} rounded-full flex items-center justify-center shrink-0 overflow-hidden`,style:{background:"linear-gradient(145deg, #4A90D9, #7B68EE)",boxShadow:"0 2px 10px rgba(90, 100, 220, 0.3)"},children:s.jsx(Re,{size:n})})}function Be(){return s.jsxs("div",{className:"flex items-end gap-2.5 max-w-[85%]",children:[s.jsx(B,{size:"sm"}),s.jsx("div",{className:"rounded-[16px] rounded-br-[4px] px-4 py-3 bg-white",style:{boxShadow:"0 1px 3px rgba(0,0,0,0.04)"},children:s.jsx("div",{className:"flex gap-1.5 items-center h-5",children:[0,1,2].map(t=>s.jsx(A.div,{className:"h-2 w-2 rounded-full bg-apple-tertiary",animate:{opacity:[.3,1,.3],y:[0,-3,0]},transition:{duration:.8,repeat:1/0,delay:t*.15,ease:"easeInOut"}},t))})})]})}function Le(){return s.jsx("div",{className:"flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium bg-purple-50 text-purple-600",children:s.jsxs(s.Fragment,{children:[s.jsx(Te,{className:"h-2.5 w-2.5"}),"AI"]})})}function Je(){const{executeMotiAction:t,changeLog:e,tasks:n,packingItems:r,expenses:a,budgetSettings:o}=he(),d=me(),p=n.length,c=n.filter(i=>i.status==="done").length,m=r.filter(i=>i.is_packed).length,f=r.length>0?Math.round(m/r.length*100):0,_=a.reduce((i,x)=>i+x.amount,0),F=o.total_budget>0?Math.round(_/o.total_budget*100):0,G=Math.max(0,Math.ceil((new Date("2026-09-11").getTime()-Date.now())/(1e3*60*60*24))),ne=y.useMemo(()=>Ue({tasksTotal:p,tasksDone:c,packingPercent:f,budgetPercent:F,daysUntilTrip:G}),[p,c,f,F,G]),[E,D]=y.useState([]),[M,Y]=y.useState(""),[T,z]=y.useState(!1),[v,ae]=y.useState(!0),[P,oe]=y.useState(2),J=y.useRef(null),re=y.useRef(null),X=E.length>P,V=X?E.slice(-P):E;y.useEffect(()=>{let i=!1;async function x(){try{const u=await te(200);if(i)return;if(u.length>0){const g=u.map(b=>({id:b.id,text:b.content,sender:b.role==="user"?"user":"bot",timestamp:new Date(b.created_at),hasAction:b.has_action}));D(g),await K()}else{const g={id:"welcome",text:se()?`אהלן! אני **${N}** — ${U}. 😏

אני מחובר ל-AI ויודע לענות על **כל** שאלה על הטיול שלכם. שאלו אותי כל דבר — מאיך לארוז עד מה לעשות ביום גשום ביוסמיטי.

🔧 **חדש!** אני יכול גם **לשנות דברים באתר** — תקציב, מסלול, ועוד. נסו: "עדכן תקציב ביטוח ל-3000"`:`אהלן! אני **${N}** — יועץ טיולים ציני. 😏

כרגע אני עובד במצב בסיסי (לא מחובר ל-AI). שאלו אותי על הטיול — ביטוח, תקציב, מסלול, אריזה, אטרקציות...

🔧 **חדש!** אני יכול גם **לשנות דברים באתר**! נסו:
• "עדכן תקציב ביטוח ל-3000"
• "שנה תקציב כולל ל-60000"
• "תוסיף עצירה ביום 5: ביקור במוזיאון"`,sender:"bot",timestamp:new Date};D([g]),C({id:g.id,role:"assistant",content:g.text,has_action:!1,created_at:new Date().toISOString()}).catch(()=>{}),await K()}}catch(u){console.warn("[Moti] Failed to load chat history:",u),D([{id:"welcome",text:`אהלן! אני **${N}** — ${U}. 😏

שאלו אותי כל דבר על הטיול!`,sender:"bot",timestamp:new Date}])}finally{i||ae(!1)}}return x(),()=>{i=!0}},[]);const j=y.useCallback((i=!1)=>{setTimeout(()=>{J.current?.scrollIntoView({behavior:i?"instant":"smooth"})},50)},[]);y.useEffect(()=>{j()},[E,T,j]),y.useEffect(()=>{v||j(!0)},[v,j]);const W=async i=>{if(!i.trim()||T)return;const x={id:`user-${Date.now()}`,text:i.trim(),sender:"user",timestamp:new Date};D(u=>[...u,x]),Y(""),z(!0),C({id:x.id,role:"user",content:x.text,has_action:!1,created_at:new Date().toISOString()}).catch(()=>{});try{const u=await ke(i);if(u.actions.length>0)for(const b of u.actions)t(b);const g={id:`bot-${Date.now()}`,text:u.text,sender:"bot",timestamp:new Date,hasAction:u.actions.length>0};D(b=>[...b,g]),C({id:g.id,role:"assistant",content:g.text,has_action:u.actions.length>0,created_at:new Date().toISOString()}).catch(()=>{})}catch{const u={id:`bot-${Date.now()}`,text:"אוי, משהו השתבש... 😅 נסו שוב?",sender:"bot",timestamp:new Date};D(g=>[...g,u])}finally{z(!1)}},ie=i=>{i.preventDefault(),W(M)},ce=V.length<=1&&!T;return v?s.jsxs("div",{className:"flex flex-col h-[calc(100dvh-8rem)] items-center justify-center",children:[s.jsx("div",{className:"h-8 w-8 animate-spin rounded-full border-4 border-black/[0.06] border-t-purple-500"}),s.jsx("p",{className:"text-sm text-apple-secondary mt-3",children:"טוען את ההיסטוריה..."})]}):s.jsxs("div",{className:"flex flex-col h-[calc(100dvh-8rem)]",children:[s.jsxs("div",{className:"flex items-center gap-3 px-5 py-4 border-b border-black/[0.04]",children:[s.jsx(B,{}),s.jsxs("div",{className:"flex-1",children:[s.jsxs("div",{className:"flex items-center gap-2",children:[s.jsx("h1",{className:"text-[17px] font-semibold text-apple-primary leading-tight",children:N}),s.jsx(Le,{})]}),s.jsx("p",{className:"text-[12px] text-apple-secondary",children:U})]}),s.jsxs("button",{onClick:()=>d("/chat/log"),className:"relative flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-500 hover:bg-purple-100 transition-colors",title:"יומן שינויים",children:[s.jsx(H,{className:"h-4 w-4"}),e.length>0&&s.jsx("span",{className:"absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-purple-500 px-1 text-[10px] font-bold text-white",children:e.length})]})]}),s.jsxs("div",{className:"flex-1 overflow-y-auto px-4 py-4 space-y-4",children:[X&&s.jsx("div",{className:"flex justify-center",children:s.jsxs("button",{onClick:()=>oe(i=>i+10),className:"flex items-center gap-1.5 rounded-full border border-black/[0.08] bg-white px-4 py-2 text-[13px] font-medium text-apple-secondary hover:bg-surface-primary transition-colors",style:{boxShadow:"0 1px 2px rgba(0,0,0,0.03)"},children:[s.jsx(H,{className:"h-3.5 w-3.5"}),"הצג הודעות ישנות (",E.length-P," נוספות)"]})}),s.jsx(fe,{initial:!1,children:V.map(i=>s.jsxs(A.div,{initial:{opacity:0,y:10,scale:.97},animate:{opacity:1,y:0,scale:1},transition:{duration:.3,ease:[.25,.46,.45,.94]},className:`flex items-end gap-2.5 ${i.sender==="user"?"flex-row-reverse max-w-[85%] mr-0 ml-auto":"max-w-[85%]"}`,children:[i.sender==="bot"&&s.jsx(B,{size:"sm"}),s.jsxs("div",{className:`rounded-[16px] px-4 py-3 ${i.sender==="user"?"bg-apple-primary text-white rounded-bl-[4px]":i.hasAction?"bg-gradient-to-br from-purple-50 to-white text-apple-primary rounded-br-[4px] ring-1 ring-purple-200":"bg-white text-apple-primary rounded-br-[4px]"}`,style:i.sender==="bot"&&!i.hasAction?{boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}:i.hasAction?{boxShadow:"0 2px 8px rgba(88,86,214,0.1)"}:void 0,children:[i.hasAction&&s.jsxs("div",{className:"flex items-center gap-1 mb-1.5 text-purple-600",children:[s.jsx(Z,{className:"h-3 w-3"}),s.jsx("span",{className:"text-[10px] font-bold uppercase tracking-wide",children:"פעולה בוצעה"})]}),s.jsx("p",{className:"text-[15px] leading-relaxed whitespace-pre-line",dangerouslySetInnerHTML:{__html:i.text.replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>").replace(/\*(.*?)\*/g,"<em>$1</em>").replace(/\n/g,"<br/>")}})]})]},i.id))}),T&&s.jsx(A.div,{initial:{opacity:0,y:6},animate:{opacity:1,y:0},children:s.jsx(Be,{})}),ce&&s.jsx(A.div,{initial:{opacity:0,y:8},animate:{opacity:1,y:0},transition:{delay:.5,duration:.4},className:"flex flex-wrap gap-2 pt-2",children:ne.map(i=>{const x=i.startsWith("עדכן")||i.startsWith("תוסיף")||i.startsWith("שנה");return s.jsxs(A.button,{whileTap:{scale:.95},onClick:()=>W(i),className:`flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[13px] font-medium transition-colors ${x?"border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100":"border-black/[0.08] bg-white text-apple-primary hover:bg-surface-primary"}`,style:{boxShadow:"0 1px 2px rgba(0,0,0,0.03)"},children:[x&&s.jsx(Z,{className:"h-3 w-3"}),i,!x&&s.jsx(ge,{className:"h-3 w-3 text-apple-tertiary"})]},i)})}),s.jsx("div",{ref:J})]}),s.jsx("div",{className:"border-t border-black/[0.04] px-4 py-3 pb-safe bg-white/80 backdrop-blur-xl",children:s.jsxs("form",{onSubmit:ie,className:"flex items-center gap-2",children:[s.jsx("input",{ref:re,type:"text",value:M,onChange:i=>Y(i.target.value),placeholder:T?"מוטי חושב...":"שאלו את מוטי או בקשו עדכון...",disabled:T,className:"flex-1 rounded-full bg-surface-primary px-4 py-2.5 text-[15px] text-apple-primary placeholder:text-apple-tertiary outline-none focus:ring-2 focus:ring-ios-blue/20 transition-shadow disabled:opacity-60"}),s.jsx(A.button,{type:"submit",disabled:!M.trim()||T,whileTap:{scale:.9},className:"flex h-10 w-10 items-center justify-center rounded-full bg-apple-primary text-white disabled:opacity-30 transition-opacity",children:s.jsx(we,{className:"h-[18px] w-[18px]",strokeWidth:2})})]})})]})}export{Je as default};
