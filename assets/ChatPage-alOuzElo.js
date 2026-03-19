import{c as le,H as de,J as pe,K as te,N as ue,E as me,a as he,k as fe,r as m,j as n,A as ge,m as _,O as P}from"./index-Bz11f3r7.js";import{f as ye,a as xe}from"./weather-Vob-uoWl.js";import{a as be}from"./MotiRobot-CaSHg645.js";import{H as Z,Z as q}from"./zap-DKuZbGeE.js";import{A as we}from"./arrow-right-DaM4TArK.js";import{S as Ae}from"./sparkles-B2Bb2IdN.js";const Te=[["path",{d:"M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z",key:"1ffxy3"}],["path",{d:"m21.854 2.147-10.94 10.939",key:"12cjpa"}]],Se=le("send",Te),E="מוטי",L='יועץ טיולים ציני (מופעל ע"י AI)',R={טיסות:"flights",טיסה:"flights",לינה:"accommodation",מלון:"accommodation",אירוח:"accommodation",אוכל:"food",מזון:"food",תחבורה:"transport",הסעות:"transport",רכב:"transport",אטרקציות:"attractions",כרטיסים:"attractions",קניות:"shopping",שופינג:"shopping",תקשורת:"communication",סים:"communication",ביטוח:"insurance",אחר:"other"},M={};for(const[s,t]of Object.entries(R))M[t]||(M[t]=s);for(const[s,{label:t}]of Object.entries(me))M[s]=t;const j={};for(let s=1;s<=20;s++)j[`יום ${s}`]=`day-${s}`,j[`day ${s}`]=`day-${s}`,j[`${s}`]=`day-${s}`;function _e(s){const t=s.match(/(\d[\d,]*)/g);if(!t)return null;for(let a=t.length-1;a>=0;a--){const e=Number(t[a].replace(/,/g,""));if(e>0)return e}return null}function Ie(s){const t=s.toLowerCase();for(const[a,e]of Object.entries(R))if(t.includes(a))return e;return null}function Q(s){const t=s.toLowerCase();for(const[e,r]of Object.entries(j))if(t.includes(e))return r;const a=t.match(/(\d{1,2})\s*(בספט|ספט|\/9|\.9)/);if(a){const r=Number(a[1])-10;if(r>=1&&r<=20)return`day-${r}`}return null}function ke(s){const t=s.trim(),a=[],e=[/(?:תעדכן|עדכן|שנה|תשנה|הגדר|תגדיר|קבע|תקבע)\s.*?תקציב\s.*?(?:ה)?(טיסות|טיסה|לינה|מלון|אירוח|אוכל|מזון|תחבורה|הסעות|רכב|אטרקציות|כרטיסים|קניות|שופינג|תקשורת|סים|ביטוח|אחר)\s.*?(?:ל[-\s]?)?(\d[\d,]*)/,/(?:תעדכן|עדכן|שנה|תשנה|הגדר|תגדיר|קבע|תקבע)\s.*?(?:ה)?(טיסות|טיסה|לינה|מלון|אירוח|אוכל|מזון|תחבורה|הסעות|רכב|אטרקציות|כרטיסים|קניות|שופינג|תקשורת|סים|ביטוח|אחר)\s.*?(?:ל[-\s]?)?(\d[\d,]*)/,/תקציב\s+(?:ה)?(טיסות|טיסה|לינה|מלון|אירוח|אוכל|מזון|תחבורה|הסעות|רכב|אטרקציות|כרטיסים|קניות|שופינג|תקשורת|סים|ביטוח|אחר)\s.*?(?:ל[-\s]?)?(\d[\d,]*)/,/(?:ה)?(טיסות|טיסה|לינה|מלון|אירוח|אוכל|מזון|תחבורה|הסעות|רכב|אטרקציות|כרטיסים|קניות|שופינג|תקשורת|סים|ביטוח|אחר)\s.*?תקציב\s.*?(?:ל[-\s]?)?(\d[\d,]*)/];for(const i of e){const l=t.match(i);if(l){const f=R[l[1]],w=Number(l[2].replace(/,/g,""));if(f&&w>0)return a.push({type:"UPDATE_BUDGET_CATEGORY",category:f,amount:w}),a}}const r=t.match(/(?:תעדכן|עדכן|שנה|תשנה|הגדר|תגדיר|קבע|תקבע)\s.*?תקציב\s+(?:ה)?כולל\s.*?(?:ל[-\s]?)?(\d[\d,]*)/);if(r){const i=Number(r[1].replace(/,/g,""));if(i>0)return a.push({type:"UPDATE_TOTAL_BUDGET",amount:i}),a}const h=t.match(/(?:תעדכן|עדכן|שנה|תשנה|הגדר|תגדיר|קבע|תקבע)\s.*?תקציב\s+(?:ה)?יומי\s.*?(?:ל[-\s]?)?(\d[\d,]*)/);if(h){const i=Number(h[1].replace(/,/g,""));if(i>0)return a.push({type:"UPDATE_DAILY_BUDGET",amount:i}),a}if(/(?:תעדכן|עדכן|שנה|תשנה|הגדר|תגדיר|קבע|תקבע)/.test(t)){const i=Ie(t),l=_e(t);if(i&&l&&l>0)return a.push({type:"UPDATE_BUDGET_CATEGORY",category:i,amount:l}),a}if(t.match(/(?:תוסיף|הוסף|תכניס|הכנס)\s+(?:עצירה|תחנה|פעילות|אטרקציה)\s+(?:ב)?(יום\s+\d+|\d{1,2}\s*בספט)/)){const i=Q(t);if(i){const f=(t.split(/יום\s+\d+|\d{1,2}\s*בספט/)[1]||"").replace(/^[\s:—\-]+/,"").trim()||"עצירה חדשה";return a.push({type:"ADD_ITINERARY_STOP",dayId:i,stop:{title:f,category:"activity"}}),a}}if(t.match(/(?:תוסיף|הוסף|תעדכן|עדכן)\s+(?:הערה|הערות|פתק)\s+(?:ל|ב)?(יום\s+\d+|\d{1,2}\s*בספט)/)){const i=Q(t);if(i){const f=(t.split(/יום\s+\d+|\d{1,2}\s*בספט/)[1]||"").replace(/^[\s:—\-]+/,"").trim()||"";if(f)return a.push({type:"UPDATE_ITINERARY_DAY_NOTES",dayId:i,notes:f}),a}}return a}let b=[],k="",$="";const N=15;async function ee(){try{ye().then(r=>{$=xe(r)}).catch(()=>{});const s=await de();k=s.summary||"",b=(await pe(N)).map(r=>({role:r.role,content:r.content}));const a=await te(1e3),e=a.length;if(e>s.message_count+10&&e>N){const r=a.slice(0,Math.max(0,e-N));r.length>0&&se()&&Ne(r,e).catch(()=>{})}}catch(s){console.warn("[Moti] Failed to load conversation from DB:",s)}}async function Ne(s,t){try{const a="https://lsmqhowvmqwgztpnshbc.supabase.co",e="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzbXFob3d2bXF3Z3p0cG5zaGJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0Mjg1ODEsImV4cCI6MjA4OTAwNDU4MX0.7uut7czVyIP7c3LVn8fJncXkNJPU9cTea2nS0dOmS6E",r=await fetch(`${a}/functions/v1/moti-chat`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${e}`,apikey:e},body:JSON.stringify({messages:[{role:"user",content:`סכם את השיחה הבאה ב-3-4 משפטים קצרים בעברית. התמקד בנושאים העיקריים, החלטות שהתקבלו, ובקשות חוזרות. אל תכלול פרטי שיחה טכניים.

שיחה:
${s.map(p=>`${p.role==="user"?"משתמש":"מוטי"}: ${p.content.slice(0,200)}`).join(`
`)}`}],summarize:!0})}),h=r.ok?await r.json():null;h?.text&&(k=h.text,await ue(h.text,t))}catch{console.warn("[Moti] Failed to generate memory summary")}}function De(s){const t=[];for(const{tool:a,input:e}of s)switch(a){case"update_budget_category":e.category&&e.amount&&t.push({type:"UPDATE_BUDGET_CATEGORY",category:String(e.category),amount:Number(e.amount)});break;case"update_total_budget":e.amount&&t.push({type:"UPDATE_TOTAL_BUDGET",amount:Number(e.amount)});break;case"update_daily_budget":e.amount&&t.push({type:"UPDATE_DAILY_BUDGET",amount:Number(e.amount)});break;case"add_expense":e.title&&e.amount&&t.push({type:"ADD_EXPENSE",expense:{title:String(e.title),amount:Number(e.amount),currency:"₪",category:String(e.category||"other"),paid_by:e.paid_by||"aba",date:String(e.date||new Date().toISOString().split("T")[0])}});break;case"add_task":t.push({type:"ADD_TASK",task:{title:String(e.title),description:e.description?String(e.description):void 0,status:"todo",priority:e.priority||"medium",group:e.group||"pre_trip",assigned_to:e.assigned_to||["aba"],due_date:e.due_date?String(e.due_date):void 0}});break;case"complete_task":e.task_title&&t.push({type:"COMPLETE_TASK",taskTitle:String(e.task_title)});break;case"add_note":t.push({type:"ADD_NOTE",note:{text:String(e.text),author:e.author||"aba",color:e.color||"yellow",locationId:e.location_id?String(e.location_id):null,pinned:!!e.pinned}});break;case"toggle_packing_item":e.item_name&&t.push({type:"TOGGLE_PACKING_ITEM",itemName:String(e.item_name)});break;case"add_itinerary_stop":e.day_id&&e.title&&t.push({type:"ADD_ITINERARY_STOP",dayId:String(e.day_id),stop:{title:String(e.title),description:e.description?String(e.description):void 0,category:e.category?String(e.category):void 0,start_time:e.start_time?String(e.start_time):void 0}});break;case"ask_clarification":t.push({type:"ASK_CLARIFICATION",question:String(e.question)});break}return t}async function Ee(s,t){const a=ke(s);if(b.push({role:"user",content:s}),b.length>N&&(b=b.slice(-N)),a.length>0){const p=je(a);return b.push({role:"assistant",content:p}),{text:p,actions:a}}const e="https://lsmqhowvmqwgztpnshbc.supabase.co",r="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzbXFob3d2bXF3Z3p0cG5zaGJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0Mjg1ODEsImV4cCI6MjA4OTAwNDU4MX0.7uut7czVyIP7c3LVn8fJncXkNJPU9cTea2nS0dOmS6E";try{const p=[...b];if(k||$){const i=[];k&&i.push(`[זיכרון משיחות קודמות: ${k}]`),$&&i.push(`[${$}]`),p.unshift({role:"user",content:i.join(`

`)},{role:"assistant",content:"תודה, אני מעודכן. במה אפשר לעזור?"})}const T=await fetch(`${e}/functions/v1/moti-chat`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${r}`,apikey:r},body:JSON.stringify({messages:p,appContext:t||""})});if(T.ok){const i=await T.json();if(i?.text!==void 0){const l=i.text;b.push({role:"assistant",content:l});const f=De(i.actions||[]),w=a.length>0?a:f;return{text:l,actions:w}}}console.warn("AI request failed with status:",T.status)}catch(p){console.warn("AI request failed, falling back to keywords:",p)}const h=Oe(s);return b.push({role:"assistant",content:h}),{text:h,actions:[]}}function je(s){const t=[];for(const a of s)switch(a.type){case"UPDATE_BUDGET_CATEGORY":{const e=M[a.category]||a.category;t.push(`בוצע! עדכנתי את תקציב **${e}** ל-**₪${a.amount.toLocaleString()}**. ✅

תבדקו בעמוד התקציב — הכל מעודכן שם.`);break}case"UPDATE_TOTAL_BUDGET":t.push(`בוצע! עדכנתי את **התקציב הכולל** ל-**₪${a.amount.toLocaleString()}**. ✅

מקווה שמצאתם עוד כסף מתחת לספה.`);break;case"UPDATE_DAILY_BUDGET":t.push(`בוצע! עדכנתי את **התקציב היומי** ל-**₪${a.amount.toLocaleString()}**. ✅`);break;case"ADD_EXPENSE":t.push(`בוצע! הוספתי הוצאה חדשה: **${a.expense.title}** בסך **₪${a.expense.amount.toLocaleString()}**. ✅`);break;case"UPDATE_ITINERARY_DAY_NOTES":t.push(`בוצע! עדכנתי את ההערות ל-**${a.dayId.replace("day-","יום ")}**. ✅

תבדקו בלוח הזמנים.`);break;case"ADD_ITINERARY_STOP":t.push(`בוצע! הוספתי עצירה חדשה ל-**${a.dayId.replace("day-","יום ")}**: **${a.stop.title}**. ✅

תבדקו בלוח הזמנים — הכל מעודכן.`);break}return t.join(`

`)+`

עוד משהו לעדכן? אני פה. 😏`}const c={dates:"10-30 בספטמבר 2026",duration:"21 יום",route:"תל אביב → דנבר → בוזמן → ילוסטון → ג'קסון → ברייס קניון → זאיון → לאס וגאס → יוסמיטי → סן פרנסיסקו → תל אביב",flights:{outbound:"El Al LY001, TLV→DEN, 10 בספטמבר 2026",return:"SFO→TLV, 30 בספטמבר 2026"},rv:"Cruise America Class C, איסוף Bozeman 11/9, החזרה SF area 28/9",family:"5 בני משפחה: אבא, אמא, ילד 1, ילד 2, ילד 3",budget:{total:"50,000 ₪",flights:"14,000 ₪",accommodation:"12,000 ₪",food:"6,000 ₪",transport:"5,000 ₪",attractions:"5,000 ₪",shopping:"4,000 ₪",insurance:"2,000 ₪",daily:"2,500 ₪"}},$e=["אוקיי, שאלת את מוטי — אז תקבל את האמת.","טוב, בוא נדבר תכלס.","אהה, שאלה מעולה. ואני אומר את זה בלי אירוניה. טוב, אולי קצת.","שנייה, מסדר את המשקפיים של היועץ...","מוטי פה. יאללה, לעניין.","אוף, חשבתי שלא תשאלו לעולם."],Me=["עוד שאלות? אני פה, לא שיש לי ברירה. 😏","תודו שאני שווה כל שקל. אה רגע, אני בחינם.","בבקשה, בלי תשלום. הפעם.","מוטי לשירותכם. 24/7. כי אין לי חיים."];function U(s){return s[Math.floor(Math.random()*s.length)]}function u(s){return`${U($e)}

${s}

${U(Me)}`}const ve=[{keywords:["ביטוח","insurance"],response:()=>u(`ביטוח נסיעות — תזמינו **לפחות חודש לפני** הטיסה. יש לכם תקציב של ${c.budget.insurance} לביטוח.

כמה טיפים ממוטי:
• קנו ביטוח עם כיסוי רפואי של לפחות $1M — אמריקה זו לא קופת חולים
• וודאו שהביטוח מכסה פעילות אתגרית (הייקינג בגרנד קניון זה לא טיול בפארק הירקון)
• שמרו את הפוליסה בנייד + עותק מודפס
• שימו לב שהביטוח מכסה את כל 5 בני המשפחה

💡 *רוצים לעדכן את תקציב הביטוח? כתבו: "עדכן תקציב ביטוח ל-3000"*`)},{keywords:["תקציב","כסף","budget","עלות","מחיר"],response:()=>u(`התקציב הכולל: **${c.budget.total}**

הנה הפירוט (תחזיקו חזק):
✈️ טיסות: ${c.budget.flights}
🏨 לינה: ${c.budget.accommodation}
🍔 אוכל: ${c.budget.food}
🚗 תחבורה: ${c.budget.transport}
🎢 אטרקציות: ${c.budget.attractions}
🛍️ קניות: ${c.budget.shopping}
🛡️ ביטוח: ${c.budget.insurance}

תקציב יומי: **${c.budget.daily}**. כלומר, תשכחו מסטייקים כל ערב. אבל In-N-Out Burger? חובה.

💡 *רוצים לשנות? כתבו למשל: "עדכן תקציב ביטוח ל-3000" או "שנה תקציב כולל ל-60000"*`)},{keywords:["טיסה","טיסות","flight","לטוס","שדה תעופה"],response:()=>u(`פרטי הטיסות שלכם:

**הלוך:** ${c.flights.outbound}
**חזור:** ${c.flights.return}

טיפ ממוטי: תגיעו 3 שעות לפני לנתב"ג. כן, אני יודע שכולם אומרים את זה. אבל עם 5 בני משפחה? תגיעו 4.

וגם: הזמינו מושבים מראש אם לא עשיתם. 5 אנשים מפוזרים במטוס = ילדים שמפריעים לזרים = הורים מתים מבושה.`)},{keywords:["קרוואן","rv","נהיגה","רכב"],response:()=>u(`הקרוואן: **${c.rv}**

כמה דברים חשובים:
• צריך **רישיון נהיגה בינלאומי** — זה במשימות שלכם, מקווה שטיפלתם
• Class C זה קרוואן על בסיס משאית — לא קטן, לא ענק, בדיוק מספיק ל-5
• תדלקו לפני שהמחוג מגיע לרבע — בגרנד קניון אין תחנת דלק בכל פינה
• נהיגה בצד ימין, לא שמאל. כן, אני צריך לומר את זה.`)},{keywords:["ילוסטון","yellowstone","גייזר","old faithful"],response:()=>u(`ילוסטון — **12-14 בספטמבר** (3 ימים!).

הפארק הלאומי הראשון בעולם. ואתם הולכים לראות למה.

טיפים ממוטי:
• Mammoth Hot Springs — טראסות גיר מטורפות, בוקר מוקדם
• עמק לאמאר — "הסרנגטי של אמריקה". משקפת חובה! זאבים, ביזונים, דובים
• Old Faithful — התפרצות כל ~90 דקות. תבדקו לוח זמנים ב-Visitor Center
• Grand Prismatic Spring — הצבעים האלה אמיתיים. רציני.
• $35 כניסה לרכב, תקף 7 ימים — מכסה גם את גרנד טיטון`)},{keywords:["ברייס","bryce","הודו","hoodoo"],response:()=>u(`ברייס קניון — **18 בספטמבר**.

זה אחד מהמקומות האלה שאתה מגיע ופתאום מבין שהטבע אמן טירוף. עמודי ההודו האלה? לא נורמלי.

טיפים:
• Navajo Loop + Queen's Garden Trail — מסלול מעגלי מושלם למשפחה
• **שקיעה מ-Bryce Point** — הצבעים משתגעים
• $35 כניסה לרכב, תקף 7 ימים
• הגובה 2,400 מ' — קצת קר בערב בספטמבר, תביאו שכבות`)},{keywords:["יוסמיטי","yosemite"],response:()=>u(`יוסמיטי — **24-26 בספטמבר** (3 ימים!).

שלושה ימים ביוסמיטי זה מושלם. בניגוד לרוב ההחלטות שלכם (צחוק, צחוק).

חובה:
• Half Dome View מ-Glacier Point
• Yosemite Falls Trail (הייק קל יחסית, מתאים לילדים)
• Tunnel View — העצירה הראשונה, הכי מצולמת
• Mariposa Grove — עצי סקויה ענקיים!

שימו לב: ספטמבר = פחות מפלים (סוף הקיץ), אבל פחות המוני אנשים. Win.`)},{keywords:["זאיון","zion"],response:()=>u(`זאיון — **16 בספטמבר**.

Angels Landing? עם ילדים? אממ... Narrows יותר בטוח ומדהים.

• The Narrows = הליכה בתוך הנהר, בין קירות סלע ענקיים. הילדים יאהבו.
• קחו נעלי מים (או שכרו ציוד בכניסה לפארק)
• Emerald Pools Trail — קל, יפה, לכל המשפחה
• השאטל בתוך הפארק חינמי — אל תנסו להיכנס ברכב`)},{keywords:["וגאס","vegas","לאס וגאס"],response:()=>u(`לאס וגאס עם ילדים. כן, אנשים עושים את זה. לא, זה לא מוזר. (קצת מוזר.)

אטרקציות למשפחה:
• High Roller — הגלגל הכי גדול בעולם, נוף מטורף
• Shark Reef ב-Mandalay Bay
• ה-Strip בלילה — פשוט ללכת ולהסתכל (חינם!)
• Bellagio Fountains — מופע מים חינמי שגורם לילדים לפעור פה

יש לכם מלון שם כבר, אז לפחות את זה סגרתם. 👏`)},{keywords:["אריזה","packing","לארוז","מזוודה"],response:()=>u(`אריזה ל-20 יום עם 5 בני משפחה. בהצלחה.

הדברים שאנשים **תמיד** שוכחים:
• מתאם חשמל לארה"ב (Type A/B — אלה עם שני פינים שטוחים)
• תרופות מרשם + צילום המרשם באנגלית
• קרם הגנה SPF50+ (ספטמבר במדבר = שמש רצחנית)
• בגדי שכבות — יוסמיטי בלילה קר, וגאס ביום רותח
• נעלי הייקינג מנוסות (לא חדשות! שבירה של נעלים בגרנד קניון = סיוט)

יש לכם רשימת אריזה מלאה במודול האריזה. תשתמשו בה. בבקשה.`)},{keywords:["מסמכים","דרכון","visa","esta","ויזה"],response:()=>u(`מסמכים — הדבר הכי משעמם והכי חשוב:

✅ 5 דרכונים — וודאו שתקפים לפחות 6 חודשים אחרי 30/9/2026
✅ ESTA — צריך לכל 5 בני המשפחה, גם הילדים
✅ ביטוח נסיעות
✅ רישיון נהיגה בינלאומי (לקרוואן!)
✅ אישורי הזמנות (טיסות, קרוואן, מלונות, דיסנילנד)

טיפ: תשמרו הכל גם בענן וגם מודפס. כי WiFi בגרנד קניון? 😂`)},{keywords:["מתי","לוח זמנים","תאריך","מסלול","route","itinerary"],response:()=>u(`המסלול המלא:

📅 **${c.dates}** (${c.duration})

${c.route}

**תחנות עיקריות:**
• 10/9 — נחיתה בדנבר
• 11/9 — טיסה לבוזמן, איסוף קרוואן
• 12-14/9 — ילוסטון
• 15-16/9 — גרנד טיטון וג'קסון
• 17/9 — יום קריעת כביש דרומה
• 18/9 — ברייס קניון
• 19-20/9 — זאיון
• 21-22/9 — לאס וגאס
• 23/9 — כביש 395 ל-Mammoth Lakes
• 24-26/9 — יוסמיטי
• 27-28/9 — נסיעה לסן פרנסיסקו
• 29/9 — החזרת קרוואן
• 30/9 — סן פרנסיסקו וטיסה הביתה

21 יום. 5 בני משפחה. קרוואן אחד. מונטנה עד קליפורניה. מה יכול להשתבש? 😄

💡 *רוצים להוסיף עצירה? כתבו: "תוסיף עצירה ביום 5: ביקור במוזיאון"*`)},{keywords:["אוכל","מסעדה","לאכול","food","restaurant"],response:()=>u(`אוכל בארה"ב! תקציב: **${c.budget.food}** לכל הטיול.

המלצות ממוטי (שאכל כל מה שאפשר):
• **In-N-Out Burger** — חובה ביום הראשון. Double-Double, Animal Style. תודו לי.
• **Trader Joe's** — סופר מעולה לקניות לקרוואן, חוסך המון
• **Costco** — חברות יומית ב-$5, שווה לקניית מים וחטיפים בכמויות
• סן פרנסיסקו: Clam Chowder ב-Fisherman's Wharf
• וגאס: Buffet — הילדים יאכלו ב-$15-20 ואתם תוציאו את הכסף

עם קרוואן, בשלו לעצמכם ארוחות בוקר וצהריים. מסעדות רק בערב = שורדים בתקציב.`)},{keywords:["san francisco","סן פרנסיסקו","sf"],response:()=>u(`סן פרנסיסקו — הסיום המושלם! **28-30 בספטמבר** (מלון).

אחרי 16 יום בקרוואן, מלון ירגיש כמו ארמון.

חובה:
• Golden Gate Bridge (הפתעה, נכון?)
• Fisherman's Wharf + Pier 39 (כלבי ים!)
• כבל קאר — הילדים ישתגעו
• Alcatraz — אם הזמנתם מראש (מומלץ!)
• Ghirardelli Square — שוקולד חינמי בחנות

וה-Fog? זה לא ערפל, זה אווירה. 😎`)},{keywords:["עזרה","help","מה אתה","מי אתה"],response:()=>`אני **מוטי** 🤖 — יועץ הטיולים הציני שלכם, מופעל על ידי AI.

אני מכיר את הטיול שלכם בע"פ: ${c.dates}, ${c.family}, מסלול מלא ברחבי ארה"ב.

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

ציני אבל מדויק. ולפחות לא משעמם. 😏`}],Ce=[`שאלה מעניינת, אבל מוטי במצב אופליין כרגע ולא מחובר ל-AI. 🔌

נסו לשאול על משהו ספציפי — טיסות, ביטוח, תקציב, אריזה, או כל מקום במסלול!

או פשוט תכתבו "עזרה" ואני אראה לכם מה אני יודע.`,`אממ... מוטי לא מחובר ל-AI כרגע, אז אני עובד במצב בסיסי. 🤖

אני מומחה לטיול שלכם לארה"ב — שאלו אותי על המסלול, התקציב, המסמכים, או כל אטרקציה ספציפית!`,`לא הבנתי, אבל אל תיקחו את זה אישית — אני במצב אופליין. 😅

שאלו על הטיול: ביטוח? דיסנילנד? גרנד קניון? אריזה? תקציב? אני פה!`];function Oe(s){const t=s.toLowerCase().trim();if(/^(היי|הי|שלום|בוקר|ערב|מה נשמע|אהלן|hey|hi|hello)/.test(t))return`שלום שלום! 👋 אני מוטי, היועץ הציני שלכם לטיול לארה"ב.

מה רוצים לדעת? יש לי דעה על הכל — ביטוח, תקציב, דיסנילנד, גרנד קניון... רק תשאלו.

🔧 **חידוש:** אני יכול גם לעדכן דברים באתר! נסו: "עדכן תקציב ביטוח ל-3000"`;for(const a of ve)if(a.keywords.some(r=>t.includes(r)))return a.response();return U(Ce)}function se(){return!0}function Pe(s){const t=[];return t.push("עדכן תקציב ביטוח ל-3000"),s.daysUntilTrip>60?t.push("מה הדבר הכי חשוב לסגור עכשיו?"):s.daysUntilTrip>14?t.push("מה עוד חסר לנו לפני הטיול?"):s.daysUntilTrip<=14&&t.push("תעשה לי רשימת last minute!"),s.packingPercent<50&&t.push("עזור לי עם רשימת האריזה"),s.budgetPercent>70&&t.push("איפה אפשר לחסוך בתקציב?"),s.tasksDone<s.tasksTotal&&t.push(`נשארו ${s.tasksTotal-s.tasksDone} משימות, מה הכי דחוף?`),t.push("תכנן לי יום מושלם ביוסמיטי"),t.push("מה המסלול המלא?"),t.push("תוסיף עצירה ביום 5: ביקור במוזיאון"),[...new Set(t)].slice(0,6)}function B({size:s="md"}){return n.jsx(be,{size:s})}function Le(){return n.jsxs("div",{className:"flex items-end gap-2.5 max-w-[85%]",children:[n.jsx(B,{size:"sm"}),n.jsx("div",{className:"rounded-[16px] rounded-br-[4px] px-4 py-3 bg-white",style:{boxShadow:"0 1px 3px rgba(0,0,0,0.04)"},children:n.jsx("div",{className:"flex gap-1.5 items-center h-5",children:[0,1,2].map(s=>n.jsx(_.div,{className:"h-2 w-2 rounded-full bg-apple-tertiary",animate:{opacity:[.3,1,.3],y:[0,-3,0]},transition:{duration:.8,repeat:1/0,delay:s*.15,ease:"easeInOut"}},s))})})]})}function Ue(){return n.jsx("div",{className:"flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium bg-purple-50 text-purple-600",children:n.jsxs(n.Fragment,{children:[n.jsx(Ae,{className:"h-2.5 w-2.5"}),"AI"]})})}function Ye(){const{executeMotiAction:s,buildMotiContext:t,changeLog:a,tasks:e,packingItems:r,expenses:h,budgetSettings:p}=he(),T=fe(),i=e.length,l=e.filter(o=>o.status==="done").length,f=r.filter(o=>o.is_packed).length,w=r.length>0?Math.round(f/r.length*100):0,ae=h.reduce((o,g)=>o+g.amount,0),G=p.total_budget>0?Math.round(ae/p.total_budget*100):0,F=Math.max(0,Math.ceil((new Date("2026-09-11").getTime()-Date.now())/(1e3*60*60*24))),ne=m.useMemo(()=>Pe({tasksTotal:i,tasksDone:l,packingPercent:w,budgetPercent:G,daysUntilTrip:F}),[i,l,w,G,F]),[I,S]=m.useState([]),[v,z]=m.useState(""),[A,J]=m.useState(!1),[C,oe]=m.useState(!0),[O,re]=m.useState(2),Y=m.useRef(null),ie=m.useRef(null),X=I.length>O,V=X?I.slice(-O):I;m.useEffect(()=>{let o=!1;async function g(){try{const d=await te(200);if(o)return;if(d.length>0){const y=d.map(x=>({id:x.id,text:x.content,sender:x.role==="user"?"user":"bot",timestamp:new Date(x.created_at),hasAction:x.has_action}));S(y),await ee()}else{const y={id:"welcome",text:se()?`אהלן! אני **${E}** — ${L}. 😏

אני מחובר ל-AI ויודע לענות על **כל** שאלה על הטיול שלכם. שאלו אותי כל דבר — מאיך לארוז עד מה לעשות ביום גשום ביוסמיטי.

🔧 **חדש!** אני יכול גם **לשנות דברים באתר** — תקציב, מסלול, ועוד. נסו: "עדכן תקציב ביטוח ל-3000"`:`אהלן! אני **${E}** — יועץ טיולים ציני. 😏

כרגע אני עובד במצב בסיסי (לא מחובר ל-AI). שאלו אותי על הטיול — ביטוח, תקציב, מסלול, אריזה, אטרקציות...

🔧 **חדש!** אני יכול גם **לשנות דברים באתר**! נסו:
• "עדכן תקציב ביטוח ל-3000"
• "שנה תקציב כולל ל-60000"
• "תוסיף עצירה ביום 5: ביקור במוזיאון"`,sender:"bot",timestamp:new Date};S([y]),P({id:y.id,role:"assistant",content:y.text,has_action:!1,created_at:new Date().toISOString()}).catch(()=>{}),await ee()}}catch(d){console.warn("[Moti] Failed to load chat history:",d),S([{id:"welcome",text:`אהלן! אני **${E}** — ${L}. 😏

שאלו אותי כל דבר על הטיול!`,sender:"bot",timestamp:new Date}])}finally{o||oe(!1)}}return g(),()=>{o=!0}},[]);const D=m.useCallback((o=!1)=>{setTimeout(()=>{Y.current?.scrollIntoView({behavior:o?"instant":"smooth"})},50)},[]);m.useEffect(()=>{D()},[I,A,D]),m.useEffect(()=>{C||D(!0)},[C,D]);const H=async o=>{if(!o.trim()||A)return;const g={id:`user-${Date.now()}`,text:o.trim(),sender:"user",timestamp:new Date};S(d=>[...d,g]),z(""),J(!0),P({id:g.id,role:"user",content:g.text,has_action:!1,created_at:new Date().toISOString()}).catch(()=>{});try{const d=await Ee(o,t());if(d.actions.length>0)for(const x of d.actions){if(x.type==="ASK_CLARIFICATION")continue;const W=s(x);W&&(d.text+=`

⚠️ ${W}`)}const y={id:`bot-${Date.now()}`,text:d.text,sender:"bot",timestamp:new Date,hasAction:d.actions.length>0};S(x=>[...x,y]),P({id:y.id,role:"assistant",content:y.text,has_action:d.actions.length>0,created_at:new Date().toISOString()}).catch(()=>{})}catch{const d={id:`bot-${Date.now()}`,text:"אוי, משהו השתבש... 😅 נסו שוב?",sender:"bot",timestamp:new Date};S(y=>[...y,d])}finally{J(!1)}},K=o=>{o.preventDefault(),H(v)},ce=V.length<=1&&!A;return C?n.jsxs("div",{className:"flex flex-col h-[calc(100dvh-8rem)] items-center justify-center",children:[n.jsx("div",{className:"h-8 w-8 animate-spin rounded-full border-4 border-black/[0.06] border-t-purple-500"}),n.jsx("p",{className:"text-sm text-apple-secondary mt-3",children:"טוען את ההיסטוריה..."})]}):n.jsxs("div",{className:"flex flex-col h-[calc(100dvh-8rem)]",children:[n.jsxs("div",{className:"flex items-center gap-3 px-5 py-4 border-b border-black/[0.04]",children:[n.jsx(B,{}),n.jsxs("div",{className:"flex-1",children:[n.jsxs("div",{className:"flex items-center gap-2",children:[n.jsx("h1",{className:"text-[17px] font-semibold text-apple-primary leading-tight",children:E}),n.jsx(Ue,{})]}),n.jsx("p",{className:"text-[12px] text-apple-secondary",children:L})]}),n.jsxs("button",{onClick:()=>T("/chat/log"),className:"relative flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-500 hover:bg-purple-100 transition-colors",title:"יומן שינויים",children:[n.jsx(Z,{className:"h-4 w-4"}),a.length>0&&n.jsx("span",{className:"absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-purple-500 px-1 text-[10px] font-bold text-white",children:a.length})]})]}),n.jsxs("div",{className:"flex-1 overflow-y-auto px-4 py-4 space-y-4",children:[X&&n.jsx("div",{className:"flex justify-center",children:n.jsxs("button",{onClick:()=>re(o=>o+10),className:"flex items-center gap-1.5 rounded-full border border-black/[0.08] bg-white px-4 py-2 text-[13px] font-medium text-apple-secondary hover:bg-surface-primary transition-colors",style:{boxShadow:"0 1px 2px rgba(0,0,0,0.03)"},children:[n.jsx(Z,{className:"h-3.5 w-3.5"}),"הצג הודעות ישנות (",I.length-O," נוספות)"]})}),n.jsx(ge,{initial:!1,children:V.map(o=>n.jsxs(_.div,{initial:{opacity:0,y:10,scale:.97},animate:{opacity:1,y:0,scale:1},transition:{duration:.3,ease:[.25,.46,.45,.94]},className:`flex items-end gap-2.5 ${o.sender==="user"?"flex-row-reverse max-w-[85%] mr-0 ml-auto":"max-w-[85%]"}`,children:[o.sender==="bot"&&n.jsx(B,{size:"sm"}),n.jsxs("div",{className:`rounded-[16px] px-4 py-3 ${o.sender==="user"?"bg-apple-primary text-white rounded-bl-[4px]":o.hasAction?"bg-gradient-to-br from-purple-50 to-white text-apple-primary rounded-br-[4px] ring-1 ring-purple-200":"bg-white text-apple-primary rounded-br-[4px]"}`,style:o.sender==="bot"&&!o.hasAction?{boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}:o.hasAction?{boxShadow:"0 2px 8px rgba(88,86,214,0.1)"}:void 0,children:[o.hasAction&&n.jsxs("div",{className:"flex items-center gap-1 mb-1.5 text-purple-600",children:[n.jsx(q,{className:"h-3 w-3"}),n.jsx("span",{className:"text-[10px] font-bold uppercase tracking-wide",children:"פעולה בוצעה"})]}),n.jsx("p",{className:"text-[15px] leading-relaxed whitespace-pre-line",dangerouslySetInnerHTML:{__html:o.text.replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>").replace(/\*(.*?)\*/g,"<em>$1</em>").replace(/\n/g,"<br/>")}})]})]},o.id))}),A&&n.jsx(_.div,{initial:{opacity:0,y:6},animate:{opacity:1,y:0},children:n.jsx(Le,{})}),ce&&n.jsx(_.div,{initial:{opacity:0,y:8},animate:{opacity:1,y:0},transition:{delay:.5,duration:.4},className:"flex flex-wrap gap-2 pt-2",children:ne.map(o=>{const g=o.startsWith("עדכן")||o.startsWith("תוסיף")||o.startsWith("שנה");return n.jsxs(_.button,{whileTap:{scale:.95},onClick:()=>H(o),className:`flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[13px] font-medium transition-colors ${g?"border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100":"border-black/[0.08] bg-white text-apple-primary hover:bg-surface-primary"}`,style:{boxShadow:"0 1px 2px rgba(0,0,0,0.03)"},children:[g&&n.jsx(q,{className:"h-3 w-3"}),o,!g&&n.jsx(we,{className:"h-3 w-3 text-apple-tertiary"})]},o)})}),n.jsx("div",{ref:Y})]}),n.jsx("div",{className:"border-t border-black/[0.04] px-4 py-3 pb-safe bg-white/80 backdrop-blur-xl",children:n.jsxs("form",{onSubmit:K,className:"flex items-end gap-2",children:[n.jsx("textarea",{ref:ie,value:v,onChange:o=>z(o.target.value),onKeyDown:o=>{o.key==="Enter"&&!o.shiftKey&&(o.preventDefault(),K(o))},placeholder:A?"מוטי חושב...":"שאלו את מוטי או בקשו עדכון...",disabled:A,rows:1,className:"flex-1 rounded-2xl bg-surface-primary px-4 py-2.5 text-[15px] text-apple-primary placeholder:text-apple-tertiary outline-none focus:ring-2 focus:ring-ios-blue/20 transition-shadow disabled:opacity-60 resize-none max-h-32 overflow-y-auto",style:{minHeight:"40px"}}),n.jsx(_.button,{type:"submit",disabled:!v.trim()||A,whileTap:{scale:.9},className:"flex h-10 w-10 items-center justify-center rounded-full bg-apple-primary text-white disabled:opacity-30 transition-opacity",children:n.jsx(Se,{className:"h-[18px] w-[18px]",strokeWidth:2})})]})})]})}export{Ye as default};
