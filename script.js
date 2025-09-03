
// const API_URL = 'https://script.google.com/macros/s/AKfycbwB0VE5COC0e6NQNKrxQeNRu2Mtt_QuMbVoBrH7tE6Da3X3BP6UxK926bt9fDO0WPU5/exec';

// let currentTab = 'places';
// let uploadedImages = [];
// let uploadedVideos = [];
// let editingAdId = null;
// const recentUploads = {};
// const THEME_KEY = 'khedmatak_theme';

// /* Theme */
// function applyTheme(theme) {
//   if (theme === 'dark') {
//     document.body.classList.add('dark');
//     const icon = document.getElementById('themeIcon');
//     const lbl = document.getElementById('themeLabel');
//     if (icon) icon.className = 'fas fa-sun';
//     if (lbl) lbl.textContent = 'الوضع النهاري';
//   } else {
//     document.body.classList.remove('dark');
//     const icon = document.getElementById('themeIcon');
//     const lbl = document.getElementById('themeLabel');
//     if (icon) icon.className = 'fas fa-moon';
//     if (lbl) lbl.textContent = 'الوضع الليلي';
//   }
//   try { localStorage.setItem(THEME_KEY, theme || 'light'); } catch (e) {}
// }
// function toggleTheme() {
//   const cur = (localStorage.getItem(THEME_KEY) === 'dark') ? 'dark' : 'light';
//   applyTheme(cur === 'dark' ? 'light' : 'dark');
// }
// function initTheme() {
//   try {
//     const saved = localStorage.getItem(THEME_KEY);
//     if (saved) applyTheme(saved);
//     else {
//       const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
//       applyTheme(prefersDark ? 'dark' : 'light');
//     }
//   } catch (e) { applyTheme('light'); }
// }

// /* API helpers */
// async function apiFetch(url, opts = {}) {
//   try {
//     const res = await fetch(url, opts);
//     const text = await res.text();
//     let data = null;
//     try { data = JSON.parse(text); } catch { data = text; }
//     return { ok: res.ok, status: res.status, data, raw: text };
//   } catch (err) {
//     return { ok: false, status: 0, error: err.message || String(err) };
//   }
// }
// async function apiPost(payload) {
//   try {
//     if (payload instanceof FormData) {
//       return await apiFetch(API_URL, { method: 'POST', body: payload });
//     }
//     if (typeof payload === 'object' && payload !== null) {
//       const form = new FormData();
//       for (const k of Object.keys(payload)) {
//         const v = payload[k];
//         if (v !== null && typeof v === 'object') form.append(k, JSON.stringify(v));
//         else form.append(k, v === undefined ? '' : v);
//       }
//       return await apiFetch(API_URL, { method: 'POST', body: form });
//     }
//     return await apiFetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: String(payload) });
//   } catch (err) {
//     return { ok: false, status: 0, error: err.message || String(err) };
//   }
// }

// /* Init */
// document.addEventListener('DOMContentLoaded', () => {
//   initializeApp();
//   initTheme();
//   const themeBtn = document.getElementById('themeToggleBtn');
//   if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

//   setupEventListeners();
//   loadLookupsAndPopulate();
//   loadPlacesForAds();
//   setupAuthUI();
//   initMapAutoLocate();
//   initMapLinkAutoFill();

//   if (typeof updateAdsTabVisibility === 'function') updateAdsTabVisibility();

//   const stored = getLoggedPlace();
//   if (stored && stored.id) showPlaceStatusBar(stored);
//   else hidePlaceStatusBar();
//   initPlaceStatusButtons();
// });

// function initializeApp() {
//   const today = new Date().toISOString().split('T')[0];
//   const startInput = document.querySelector('input[name="startDate"]');
//   const endInput = document.querySelector('input[name="endDate"]');
//   if (startInput) startInput.value = today;
//   const nextWeek = new Date(); nextWeek.setDate(nextWeek.getDate() + 7);
//   if (endInput) endInput.value = nextWeek.toISOString().split('T')[0];
// }

// /* Events */
// function setupEventListeners() {
//   const placeForm = document.getElementById('placeForm');
//   const adForm = document.getElementById('adForm');
//   const citySelect = document.querySelector('select[name="city"]');
//   const goPackagesBtn = document.getElementById('goPackagesBtn');

//   if (placeForm) placeForm.addEventListener('submit', handlePlaceSubmit);
//   if (adForm) adForm.addEventListener('submit', handleAdSubmit);
//   if (citySelect) citySelect.addEventListener('change', updateAreas);
//   if (goPackagesBtn) goPackagesBtn.addEventListener('click', () => {
//     const logged = getLoggedPlace();
//     if (!logged || !logged.id) {
//       showError('احفظ بيانات المكان أولاً للانتقال إلى الباقات');
//       return;
//     }
//     showTab('packages');
//   });
// }

// /* Lookups & populate */
// async function loadLookupsAndPopulate() {
//   try {
//     const resp = await apiFetch(`${API_URL}?action=getLookups`);
//     if (!resp.ok) { console.warn('getLookups failed', resp); return; }
//     const json = resp.data;
//     const data = (json && json.success && json.data) ? json.data : json;
//     if (!data) return;

//     window.lastLookups = data;

//     const actSelect = document.querySelector('select[name="activityType"]');
//     if (actSelect) {
//       actSelect.innerHTML = '<option value="">اختر نوع النشاط</option>';
//       (data.activities || []).forEach(a => {
//         const opt = document.createElement('option'); opt.value = a.id; opt.textContent = a.name; actSelect.appendChild(opt);
//       });
//     }

//     const citySelect = document.querySelector('select[name="city"]');
//     if (citySelect) {
//       citySelect.innerHTML = '<option value="">اختر المدينة</option>';
//       (data.cities || []).forEach(c => {
//         const opt = document.createElement('option'); opt.value = c.id; opt.textContent = c.name; citySelect.appendChild(opt);
//       });
//     }

//     const cityAreaMap = {};
//     (data.areas || []).forEach(a => {
//       const cid = a.raw && (a.raw['ID المدينة'] || a.raw['cityId']) ? String(a.raw['ID المدينة'] || a.raw['cityId']) : '';
//       if (!cityAreaMap[cid]) cityAreaMap[cid] = [];
//       cityAreaMap[cid].push({ id: a.id, name: a.name });
//     });
//     window.cityAreaMap = cityAreaMap;

//     const siteSelects = document.querySelectorAll('select[name="location"]');
//     siteSelects.forEach(s => {
//       s.innerHTML = '<option value="">اختر الموقع</option>';
//       (data.sites || []).forEach(site => {
//         const opt = document.createElement('option'); opt.value = site.id; opt.textContent = site.name; s.appendChild(opt);
//       });
//     });

//     // شبكة الباقات مع تمييز الحالية وتحديث نص الزر
//     const pkgGrid = document.getElementById('packagesGrid');
//     if (pkgGrid) {
//       pkgGrid.innerHTML = '';
//       const logged = getLoggedPlace();
//       const currentPkgId = logged && logged.raw ? String(logged.raw['الباقة'] || logged.package || logged.raw['packageId'] || '') : '';
//       const currentPkgStatus = logged && logged.raw ? String(logged.raw['حالة الباقة'] || logged.packageStatus || '').trim() : '';

//       (data.packages || []).forEach(p => {
//         const div = document.createElement('div');
//         div.className = 'pkg-card';
//         const h = document.createElement('h3'); h.textContent = p.name;

//         const dur = Number(p.duration || (p.raw && (p.raw['مدة الباقة باليوم'] || p.raw['مدة'])) || 0) || 0;
//         const price = Number(p.price || (p.raw && (p.raw['سعر الباقة'] || p.raw['السعر'])) || 0) || 0;
//         const allowed = Number(p.allowedAds || (p.raw && (p.raw['عدد الاعلانات'] || p.raw['عدد_الاعلانات'])) || 0) || 0;

//         const d = document.createElement('p');
//         d.textContent = `المدة: ${dur} يوم · السعر: ${price} · الإعلانات: ${allowed}`;

//         const desc = document.createElement('p');
//         desc.textContent = p.raw && (p.raw['وصف الباقة'] || p.raw['description']) ? (p.raw['وصف الباقة'] || p.raw['description']) : '';

//         const btn = document.createElement('button');
//         btn.className = 'choose-pkg';

//         const isCurrent = currentPkgId && String(p.id) === String(currentPkgId);
//         if (isCurrent) {
//           div.style.border = '2px solid #10b981';
//           div.style.boxShadow = '0 6px 18px rgba(16,185,129,0.15)';
//           const badge = document.createElement('div');
//           badge.textContent = 'باقتك الحالية';
//           badge.style.cssText = 'display:inline-block;background:#10b981;color:#fff;padding:4px 8px;border-radius:999px;margin-bottom:8px;font-size:12px;font-weight:700';
//           div.insertBefore(badge, h);
//         }

//         if (isCurrent && currentPkgStatus === 'مفعلة') {
//           btn.textContent = 'هذه باقتك';
//           btn.disabled = true;
//         } else if (isCurrent && currentPkgStatus === 'قيد الدفع') {
//           btn.textContent = 'قيد الدفع';
//           btn.disabled = true;
//         } else if (isCurrent && currentPkgStatus === 'منتهية') {
//           btn.textContent = 'إعادة التفعيل';
//         } else {
//           if (price === 0) btn.textContent = 'تفعيل فوري';
//           else btn.textContent = 'اختر الباقة';
//         }

//         btn.onclick = async () => {
//           const logged = getLoggedPlace();
//           if (!logged || !logged.id) { showError('احفظ بيانات المكان أولاً'); return; }

//           // حماية التجريبية/المجانية بحسب منطقك السابق
//           if (price === 0) {
//             const block = await checkIfTrialIsUsed(logged.id);
//             if (block) { showError('الباقة التجريبية غير متاحة مرة أخرى بعد انتهاء اشتراك سابق.'); return; }
//           }
//           await choosePackageAPI(p.id, { price });
//         };

//         div.appendChild(h);
//         div.appendChild(d);
//         if (desc.textContent) div.appendChild(desc);
//         div.appendChild(btn);
//         pkgGrid.appendChild(div);
//       });
//     }

//     window.availablePaymentMethods = (data.payments || data.paymentsMethods || []).map(pm => ({
//       id: pm.id || pm.raw && pm.raw['معرف الدفع'],
//       name: pm.name || pm.raw && (pm.raw['طرق الدفع'] || pm.raw['طريقة الدفع']),
//       raw: pm.raw || pm
//     }));

//     const stored = getLoggedPlace();
//     if (stored && stored.raw) {
//       await tryPrefillPlaceForm(stored);
//       if (stored.id) {
//         if (typeof checkAdQuotaAndToggle === 'function') checkAdQuotaAndToggle(stored.id);
//         if (typeof loadAdsForPlace === 'function') loadAdsForPlace(stored.id);
//       }
//     }

//     if (typeof updateAdsTabVisibility === 'function') updateAdsTabVisibility();
//     await refreshPackageUIFromDashboard();
//   } catch (err) {
//     console.error('loadLookupsAndPopulate error', err);
//   }
// }

// /* City areas */
// function updateAreas() {
//   const citySelect = document.querySelector('select[name="city"]');
//   const areaSelect = document.querySelector('select[name="area"]');
//   if (!citySelect || !areaSelect) return;
//   areaSelect.innerHTML = '<option value="">اختر المنطقة</option>';
//   const selected = citySelect.value;
//   if (selected && window.cityAreaMap && window.cityAreaMap[selected]) {
//     window.cityAreaMap[selected].forEach(a => {
//       const opt = document.createElement('option'); opt.value = a.id; opt.textContent = a.name; areaSelect.appendChild(opt);
//     });
//   }
// }

// /* Tabs */
// function showTab(tabName) {
//   document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');
//   document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
//   const target = document.getElementById(tabName + '-tab');
//   if (target) target.style.display = 'block';
//   const tabEl = document.getElementById('tab-' + tabName);
//   if (tabEl) tabEl.classList.add('active');
//   currentTab = tabName;
// }

// /* Previews */
// function previewImage(input, previewId) {
//   const preview = document.getElementById(previewId);
//   if (!preview) return;
//   preview.innerHTML = '';
//   if (input.files && input.files[0]) {
//     const file = input.files[0];
//     const reader = new FileReader();
//     reader.onload = e => {
//       const img = document.createElement('img');
//       img.src = e.target.result;
//       preview.appendChild(img);
//       uploadedImages = [file];
//     };
//     reader.readAsDataURL(file);
//   }
// }
// function previewMultipleImages(input, previewId) {
//   const preview = document.getElementById(previewId);
//   if (!preview) return;
//   preview.innerHTML = '';
//   uploadedImages = [];
//   if (!input.files) return;
//   const files = Array.from(input.files).slice(0, 8);
//   if (input.files.length > 8) showError('يمكن تحميل حتى 8 صور كحد أقصى. سيتم أخذ أول 8 صور.');
//   files.forEach(file => {
//     const reader = new FileReader();
//     reader.onload = e => {
//       const div = document.createElement('div');
//       div.className = 'preview-image';
//       const img = document.createElement('img');
//       img.src = e.target.result;
//       const removeBtn = document.createElement('button');
//       removeBtn.className = 'remove-image';
//       removeBtn.innerHTML = '×';
//       removeBtn.onclick = () => {
//         div.remove();
//         uploadedImages = uploadedImages.filter(f => f !== file);
//       };
//       div.appendChild(img);
//       div.appendChild(removeBtn);
//       preview.appendChild(div);
//       uploadedImages.push(file);
//     };
//     reader.readAsDataURL(file);
//   });
// }
// function previewVideo(input, previewId) {
//   const preview = document.getElementById(previewId);
//   if (!preview) return;
//   preview.innerHTML = '';
//   uploadedVideos = [];
//   if (input.files && input.files[0]) {
//     const file = input.files[0];
//     const reader = new FileReader();
//     reader.onload = e => {
//       const video = document.createElement('video');
//       video.src = e.target.result;
//       video.controls = true;
//       video.style.width = '100%';
//       preview.appendChild(video);
//       uploadedVideos = [file];
//     };
//     reader.readAsDataURL(file);
//   }
// }

// /* Upload */
// async function readFileAsBase64(file) {
//   return new Promise((resolve, reject) => {
//     const reader = new FileReader();
//     reader.onload = () => {
//       const result = reader.result;
//       const base64 = String(result).split(',')[1] || '';
//       resolve(base64);
//     };
//     reader.onerror = reject;
//     reader.readAsDataURL(file);
//   });
// }
// async function uploadToGoogleDrive(file, folder, placeId = null) {
//   if (!API_URL || !API_URL.startsWith('http')) {
//     return `https://drive.google.com/file/d/${Math.random().toString(36).substr(2, 9)}/view`;
//   }
//   const base64 = await readFileAsBase64(file);
//   const form = new FormData();
//   form.append('action', 'uploadFile');
//   form.append('folder', folder);
//   form.append('fileName', file.name);
//   form.append('mimeType', file.type || 'application/octet-stream');
//   form.append('fileData', base64);
//   if (placeId) form.append('placeId', placeId);
//   const resp = await apiPost(form);
//   if (!resp.ok) throw new Error('فشل رفع الملف');
//   const data = resp.data;
//   const up = (data && data.data) ? data.data : data;
//   const fileUrl = (up && (up.fileUrl || up.url)) || (resp && resp.fileUrl) || '';
//   if (fileUrl) recentUploads[file.name] = { url: fileUrl, name: file.name };
//   if (!fileUrl) throw new Error('تعذر استخراج رابط الملف من استجابة الخادم');
//   return fileUrl;
// }

// /* Place submit */
// async function handlePlaceSubmit(ev) {
//   ev.preventDefault();
//   showLoading(true);
//   const submitBtn = document.getElementById('savePlaceBtn');
//   const oldHtml = submitBtn ? submitBtn.innerHTML : '';
//   if (submitBtn) {
//     submitBtn.disabled = true;
//     submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحفظ...';
//   }
//   try {
//     const form = ev.target;
//     const formData = new FormData(form);
//     const placeData = {
//       placeName: formData.get('placeName'),
//       password: formData.get('password'),
//       activityType: formData.get('activityType'),
//       city: formData.get('city'),
//       area: formData.get('area'),
//       location: formData.get('location'),
//       detailedAddress: formData.get('detailedAddress'),
//       mapLink: formData.get('mapLink'),
//       phone: formData.get('phone'),
//       whatsappLink: formData.get('whatsappLink'),
//       email: formData.get('email'),
//       website: formData.get('website'),
//       workingHours: formData.get('workingHours'),
//       delivery: formData.get('delivery'),
//       description: formData.get('description'),
//       image: uploadedImages[0] || null
//     };

//     if (!validateFiles()) {
//       showLoading(false);
//       return;
//     }

//     const logged = getLoggedPlace();
//     let imageUrl = '';
//     if (placeData.image) {
//       const placeIdForUpload = (logged && logged.id) ? logged.id : null;
//       imageUrl = await uploadToGoogleDrive(placeData.image, 'places', placeIdForUpload);
//     }

//     const payload = { action: (logged && logged.id) ? 'updatePlace' : 'registerPlace' };
//     if (logged && logged.id) payload.placeId = logged.id;
//     const setIf = (k, v) => {
//       if (v !== undefined && v !== null && String(v).trim() !== '') payload[k] = v;
//     };

//     setIf('name', placeData.placeName);
//     setIf('password', placeData.password);
//     setIf('activityId', placeData.activityType);
//     setIf('activityType', placeData.activityType);
//     setIf('city', placeData.city);
//     setIf('area', placeData.area);
//     setIf('mall', placeData.location);
//     setIf('address', placeData.detailedAddress);
//     setIf('mapLink', placeData.mapLink);
//     setIf('phone', placeData.phone);
//     setIf('whatsappLink', placeData.whatsappLink);
//     setIf('email', placeData.email);
//     setIf('website', placeData.website);
//     setIf('hours', placeData.workingHours);
//     setIf('delivery', placeData.delivery);
//     setIf('description', placeData.description);
//     setIf('logoUrl', imageUrl);

//     const resp = await apiPost(payload);
//     if (!resp.ok) throw new Error('فشل في التواصل مع الخادم عند حفظ المكان');
//     const data = resp.data;
//     if (!data || data.success === false) {
//       const err = data && data.error ? data.error : JSON.stringify(data);
//       throw new Error(err);
//     }

//     const returned = (data && data.data) ? data.data : data;
//     if (returned.place) {
//       await setLoggedInUI(returned.place);
//     } else if (returned.id) {
//       const fetched = await fetchPlace(returned.id);
//       if (fetched) await setLoggedInUI(fetched);
//     } else if (data.data && data.data.place) {
//       await setLoggedInUI(data.data.place);
//     }

//     showSuccess('تم حفظ المكان بنجاح!');
//     const preview = document.getElementById('placeImagePreview');
//     if (preview) preview.innerHTML = '';
//     uploadedImages = [];

//     await refreshPackageUIFromDashboard();
//     loadPlacesForAds();
//     const newLogged = getLoggedPlace();
//     if (newLogged && newLogged.id) {
//       if (typeof checkAdQuotaAndToggle === 'function') checkAdQuotaAndToggle(newLogged.id);
//       if (typeof loadAdsForPlace === 'function') loadAdsForPlace(newLogged.id);
//     }
//   } catch (err) {
//     console.error('handlePlaceSubmit error', err);
//     showError(err.message || 'حدث خطأ أثناء حفظ المكان');
//   } finally {
//     showLoading(false);
//     if (submitBtn) {
//       submitBtn.disabled = false;
//       submitBtn.innerHTML = oldHtml || '<i class="fas fa-save"></i> حفظ';
//     }
//   }
// }

// /* Ads submit */
// async function handleAdSubmit(ev) {
//   ev.preventDefault();
//   showLoading(true);
//   try {
//     const form = ev.target;
//     const fd = new FormData(form);
//     const adData = {
//       placeId: fd.get('placeId'),
//       adType: fd.get('adType'),
//       adTitle: fd.get('adTitle'),
//       coupon: fd.get('coupon'),
//       adDescription: fd.get('adDescription'),
//       startDate: fd.get('startDate'),
//       endDate: fd.get('endDate'),
//       adStatus: fd.get('adStatus'),
//       adActiveStatus: fd.get('adActiveStatus'),
//       images: uploadedImages,
//       video: uploadedVideos[0] || null
//     };

//     if (!validateFiles()) {
//       showLoading(false);
//       return;
//     }

//     const imageUrls = [];
//     for (let i = 0; i < Math.min(adData.images.length, 8); i++) {
//       const file = adData.images[i];
//       const url = await uploadToGoogleDrive(file, 'ads');
//       imageUrls.push({ name: file.name, url });
//     }
//     let videoUrl = '';
//     if (adData.video) videoUrl = await uploadToGoogleDrive(adData.video, 'ads');

//     imageUrls.forEach(i => { recentUploads[i.name] = { url: i.url, name: i.name }; });

//     const logged = getLoggedPlace();
//     const placeIdToSend = (adData.placeId && adData.placeId !== '') ? adData.placeId : (logged && logged.id ? logged.id : '');

//     const payloadBase = {
//       placeId: placeIdToSend,
//       adType: adData.adType,
//       adTitle: adData.adTitle,
//       adDescription: adData.adDescription,
//       startDate: adData.startDate,
//       endDate: adData.endDate,
//       coupon: adData.coupon || '',
//       imageFiles: JSON.stringify(imageUrls.map(i => i.name || '')),
//       imageUrls: JSON.stringify(imageUrls.map(i => i.url || '')),
//       videoFile: adData.video ? (adData.video.name || '') : '',
//       videoUrl: videoUrl || '',
//       adStatus: adData.adStatus || '',
//       adActiveStatus: adData.adActiveStatus || ''
//     };

//     if (editingAdId) {
//       const resp = await apiPost({ action: 'updateAd', adId: editingAdId, ...payloadBase });
//       if (!resp.ok) throw new Error('فشل تحديث الإعلان');
//       const data = resp.data;
//       if (data && data.success === false) throw new Error(data.error || 'فشل تحديث الإعلان');
//       showSuccess('تم تحديث الإعلان');
//       if (typeof loadAdsForPlace === 'function') await loadAdsForPlace(placeIdToSend);
//       editingAdId = null;
//       const submitBtn = document.querySelector('#adForm button[type="submit"]');
//       if (submitBtn) submitBtn.textContent = 'حفظ الإعلان';
//     } else {
//       const resp = await apiPost({ action: 'addAd', ...payloadBase });
//       if (!resp.ok) throw new Error('فشل حفظ الإعلان');
//       const data = resp.data;
//       if (data && data.success === false) throw new Error(data.error || 'فشل حفظ الإعلان');

//       const returned = (data && data.data) ? data.data : data;
//       const newAdTemp = {
//         id: (returned && returned.id) ? returned.id : ('tmp_' + Date.now()),
//         placeId: placeIdToSend,
//         type: adData.adType,
//         title: adData.adTitle,
//         description: adData.adDescription,
//         startDate: adData.startDate,
//         endDate: adData.endDate,
//         status: adData.adStatus || adData.adActiveStatus || '',
//         images: imageUrls.map(i => ({ name: i.name, url: i.url })),
//         videoUrl: videoUrl || ''
//       };
//       showSuccess('تم حفظ الإعلان');
//       prependAdToList(newAdTemp);
//     }

//     ev.target.reset();
//     const ip = document.getElementById('adImagesPreview');
//     if (ip) ip.innerHTML = '';
//     const vp = document.getElementById('adVideoPreview');
//     if (vp) vp.innerHTML = '';
//     uploadedImages = [];
//     uploadedVideos = [];

//     if (placeIdToSend) {
//       if (typeof checkAdQuotaAndToggle === 'function') await checkAdQuotaAndToggle(placeIdToSend);
//       if (typeof loadAdsForPlace === 'function') await loadAdsForPlace(placeIdToSend);
//     }
//   } catch (err) {
//     console.error('handleAdSubmit error', err);
//     showError(err.message || 'حدث خطأ أثناء حفظ الإعلان');
//   } finally {
//     showLoading(false);
//   }
// }

// /* Ads list/render */
// async function loadPlacesForAds() {
//   const placeSelects = document.querySelectorAll('select[name="placeId"]');
//   placeSelects.forEach(ps => { ps.innerHTML = '<option value="">اختر المكان</option>'; });
//   const resp = await apiFetch(`${API_URL}?action=places`);
//   if (!resp.ok) { updateAdsTabVisibilitySafely(); return; }
//   const json = resp.data;
//   let places = [];
//   if (json && json.success && json.data && Array.isArray(json.data.places)) places = json.data.places;
//   else if (json && Array.isArray(json.places)) places = json.places;
//   else if (Array.isArray(json)) places = json;
//   else if (json && json.data && Array.isArray(json.data)) places = json.data;
//   else places = [];

//   places.forEach(p => {
//     placeSelects.forEach(ps => {
//       const opt = document.createElement('option'); opt.value = p.id; opt.textContent = p.name; ps.appendChild(opt);
//     });
//   });

//   const logged = getLoggedPlace();
//   if (logged && logged.id) {
//     placeSelects.forEach(ps => { ps.value = logged.id; ps.disabled = true; });
//     const tabAds = document.getElementById('tab-ads');
//     if (tabAds) tabAds.style.display = 'block';
//     if (typeof loadAdsForPlace === 'function') loadAdsForPlace(logged.id);
//   } else {
//     placeSelects.forEach(ps => { ps.disabled = false; });
//     const tabAds = document.getElementById('tab-ads');
//     if (tabAds) tabAds.style.display = 'none';
//   }

//   updateAdsTabVisibilitySafely();
// }
// function updateAdsTabVisibilitySafely() {
//   if (typeof updateAdsTabVisibility === 'function') updateAdsTabVisibility();
// }
// async function loadAdsForPlace(placeId) {
//   if (!placeId) return;
//   try {
//     const resp = await apiFetch(`${API_URL}?action=ads&placeId=${encodeURIComponent(placeId)}`);
//     if (!resp.ok) {
//       console.warn('loadAdsForPlace failed', resp);
//       return;
//     }
//     const json = resp.data;
//     const ads = (json && json.success && json.data && json.data.ads)
//       ? json.data.ads
//       : (json && json.ads)
//         ? json.ads
//         : (json && json.data && json.data)
//           ? json.data
//           : [];
//     renderAdsList(Array.isArray(ads) ? ads : []);
//   } catch (err) {
//     console.error('loadAdsForPlace error', err);
//   }
// }

// function renderAdsList(ads) {
//   let c = document.getElementById('adsListContainer');
//   if (!c) return;
//   c.innerHTML = '';
//   if (!ads || ads.length === 0) {
//     c.innerHTML = '<p>لا توجد إعلانات حالياً لهذا المحل.</p>';
//     return;
//   }
//   ads.forEach(ad => {
//     const card = document.createElement('div');
//     card.className = 'ad-card';
//     const h = document.createElement('h4');
//     h.textContent = ad.title || '(بدون عنوان)';
//     const meta = document.createElement('div');
//     meta.className = 'meta';
//     meta.textContent = `${ad.startDate || ''} — ${ad.endDate || ''} · الحالة: ${ad.status || ''}`;
//     const p = document.createElement('p');
//     p.textContent = ad.description || '';
//     card.appendChild(h);
//     card.appendChild(meta);
//     card.appendChild(p);

//     if (ad.images && ad.images.length > 0) {
//       const imgs = document.createElement('div');
//       imgs.className = 'ad-images';
//       const imagesArr = Array.isArray(ad.images)
//         ? ad.images
//         : (ad.images && typeof ad.images === 'string' ? JSON.parse(ad.images) : []);
//       imagesArr.forEach(im => {
//         let url = '', name = '';
//         if (im && typeof im === 'object') {
//           url = im.url || '';
//           name = im.name || '';
//         } else if (typeof im === 'string') {
//           name = im;
//           url = '';
//         }
//         if (!url && name && recentUploads[name]) url = recentUploads[name].url;
//         if (url) {
//           const img = document.createElement('img');
//           img.src = url;
//           img.alt = name || '';
//           imgs.appendChild(img);
//         } else if (name) {
//           const wrap = document.createElement('div');
//           wrap.className = 'img-placeholder-file';
//           wrap.textContent = name;
//           imgs.appendChild(wrap);
//         } else {
//           const wrap = document.createElement('div');
//           wrap.className = 'img-placeholder-file';
//           wrap.textContent = 'لا توجد صورة';
//           imgs.appendChild(wrap);
//         }
//       });
//       card.appendChild(imgs);
//     }

//     const actions = document.createElement('div');
//     actions.className = 'ad-actions';
//     const editBtn = document.createElement('button');
//     editBtn.className = 'btn';
//     editBtn.textContent = 'تعديل';
//     editBtn.onclick = () => startEditAd(ad);
//     const delBtn = document.createElement('button');
//     delBtn.className = 'btn btn-secondary';
//     delBtn.textContent = 'حذف';
//     delBtn.onclick = () => deleteAdConfirm(ad.id);
//     actions.appendChild(editBtn);
//     actions.appendChild(delBtn);
//     card.appendChild(actions);
//     c.appendChild(card);
//   });
// }

// function prependAdToList(ad) {
//   const container = document.getElementById('adsListContainer');
//   if (!container) return;
//   const card = document.createElement('div');
//   card.className = 'ad-card';
//   const h = document.createElement('h4');
//   h.textContent = ad.title || '(بدون عنوان)';
//   const meta = document.createElement('div');
//   meta.className = 'meta';
//   meta.textContent = `${ad.startDate || ''} — ${ad.endDate || ''} · الحالة: ${ad.status || ''}`;
//   const p = document.createElement('p');
//   p.textContent = ad.description || '';
//   card.appendChild(h);
//   card.appendChild(meta);
//   card.appendChild(p);

//   if (ad.images && ad.images.length > 0) {
//     const imgs = document.createElement('div');
//     imgs.className = 'ad-images';
//     ad.images.forEach(im => {
//       const url = im && im.url ? im.url : '';
//       const name = im && im.name ? im.name : '';
//       if (url) {
//         const img = document.createElement('img');
//         img.src = url;
//         img.alt = name || '';
//         imgs.appendChild(img);
//       } else if (name) {
//         const wrap = document.createElement('div');
//         wrap.className = 'img-placeholder-file';
//         wrap.textContent = name;
//         imgs.appendChild(wrap);
//       }
//     });
//     card.appendChild(imgs);
//   }

//   const actions = document.createElement('div');
//   actions.className = 'ad-actions';
//   const editBtn = document.createElement('button');
//   editBtn.className = 'btn';
//   editBtn.textContent = 'تعديل';
//   editBtn.onclick = () => startEditAd(ad);
//   const delBtn = document.createElement('button');
//   delBtn.className = 'btn btn-secondary';
//   delBtn.textContent = 'حذف';
//   delBtn.onclick = () => deleteAdConfirm(ad.id);
//   actions.appendChild(editBtn);
//   actions.appendChild(delBtn);
//   card.appendChild(actions);
//   container.insertBefore(card, container.firstChild);
// }

// function startEditAd(ad) {
//   try {
//     editingAdId = ad.id || null;
//     const form = document.getElementById('adForm');
//     if (!form) return;
//     form.querySelector('select[name="placeId"]').value = ad.placeId || '';
//     form.querySelector('select[name="adType"]').value = ad.type || '';
//     form.querySelector('input[name="adTitle"]').value = ad.title || '';
//     form.querySelector('input[name="coupon"]').value = ad.coupon || '';
//     form.querySelector('textarea[name="adDescription"]').value = ad.description || '';
//     form.querySelector('input[name="startDate"]').value = ad.startDate || '';
//     form.querySelector('input[name="endDate"]').value = ad.endDate || '';
//     form.querySelector('select[name="adActiveStatus"]').value = ad.adActiveStatus || ad.status || '';
//     form.querySelector('select[name="adStatus"]').value = ad.adStatus || ad.status || '';

//     const ip = document.getElementById('adImagesPreview');
//     if (ip) {
//       ip.innerHTML = '';
//       if (ad.images && ad.images.length) {
//         (Array.isArray(ad.images) ? ad.images : (ad.images && typeof ad.images === 'string' ? JSON.parse(ad.images) : [])).forEach(im => {
//           const url = im && im.url ? im.url : (typeof im === 'string' ? im : '');
//           const name = im && im.name ? im.name : (typeof im === 'string' ? im : '');
//           const div = document.createElement('div');
//           div.className = 'preview-image';
//           if (url) {
//             const img = document.createElement('img');
//             img.src = url;
//             img.style.width = '100%';
//             img.style.height = '90px';
//             img.style.objectFit = 'cover';
//             div.appendChild(img);
//           } else if (name && recentUploads[name]) {
//             const img = document.createElement('img');
//             img.src = recentUploads[name].url;
//             img.style.width = '100%';
//             img.style.height = '90px';
//             img.style.objectFit = 'cover';
//             div.appendChild(img);
//           } else if (name) {
//             const placeholder = document.createElement('div');
//             placeholder.className = 'img-placeholder-file';
//             placeholder.textContent = name;
//             div.appendChild(placeholder);
//           }
//           ip.appendChild(div);
//         });
//       }
//     }
//     const vp = document.getElementById('adVideoPreview');
//     if (vp) {
//       vp.innerHTML = '';
//       if (ad.videoUrl) {
//         const video = document.createElement('video');
//         video.src = ad.videoUrl;
//         video.controls = true;
//         video.style.width = '100%';
//         vp.appendChild(video);
//       }
//     }
//     const submitBtn = document.querySelector('#adForm button[type="submit"]');
//     if (submitBtn) submitBtn.textContent = 'تحديث الإعلان';
//     showTab('ads');
//   } catch (e) {
//     console.error('startEditAd failed', e);
//   }
// }

// async function deleteAdConfirm(adId) {
//   if (!confirm('هل أنت متأكد من حذف هذا الإعلان؟ لا يمكن التراجع.')) return;
//   try {
//     const payload = { action: 'deleteAd', adId: adId };
//     const resp = await apiPost(payload);
//     if (!resp.ok) throw new Error('فشل حذف الإعلان');
//     const data = resp.data;
//     if (data && data.success === false) throw new Error(data.error || 'فشل حذف الإعلان');
//     showSuccess('تم حذف الإعلان');
//     const logged = getLoggedPlace();
//     if (logged && logged.id) {
//       if (typeof checkAdQuotaAndToggle === 'function') checkAdQuotaAndToggle(logged.id);
//       if (typeof loadAdsForPlace === 'function') loadAdsForPlace(logged.id);
//     }
//   } catch (err) {
//     console.error('deleteAd error', err);
//     showError(err.message || 'خطأ أثناء حذف الإعلان');
//   }
// }

// /* Quota & visibility */
// async function checkAdQuotaAndToggle(placeId) {
//   try {
//     if (!placeId) {
//       const tabAds = document.getElementById('tab-ads');
//       if (tabAds) tabAds.style.display = 'none';
//       return;
//     }
//     const resp = await apiFetch(`${API_URL}?action=remainingAds&placeId=${encodeURIComponent(placeId)}`);
//     if (!resp.ok) {
//       toggleAdFormAllowed(false, 'تعذر التحقق من الباقة');
//       return;
//     }
//     const data = resp.data && resp.data.data ? resp.data.data : resp.data;
//     const remaining = Number((data && data.remaining) || 0);
//     const allowed = Number((data && data.allowed) || 0);
//     const used = Number((data && data.used) || 0);
//     showAdQuotaMessage(`الإعلانات: الكل ${allowed} · المستخدمة ${used} · المتبقي ${remaining}`);
//     toggleAdFormAllowed(remaining > 0, remaining > 0 ? '' : 'استنفدت حصة الإعلانات');
//   } catch (err) {
//     console.error('checkAdQuotaAndToggle', err);
//     toggleAdFormAllowed(false, 'خطأ أثناء التحقق');
//   }
// }
// function toggleAdFormAllowed(allowed, message) {
//   const adForm = document.getElementById('adForm');
//   if (!adForm) return;
//   const submitBtn = adForm.querySelector('button[type="submit"]');
//   if (submitBtn) {
//     submitBtn.disabled = !allowed;
//     submitBtn.style.opacity = allowed ? '1' : '0.6';
//     submitBtn.title = allowed ? '' : (message || 'غير مسموح');
//   }
//   let adNotice = document.getElementById('adQuotaNotice');
//   if (!adNotice) {
//     const container = document.getElementById('ads-tab');
//     if (container) {
//       adNotice = document.createElement('div');
//       adNotice.id = 'adQuotaNotice';
//       adNotice.style.background = '#fff3cd';
//       adNotice.style.color = '#856404';
//       adNotice.style.padding = '10px';
//       adNotice.style.borderRadius = '6px';
//       adNotice.style.marginTop = '12px';
//       container.insertBefore(adNotice, container.firstChild.nextSibling);
//     }
//   }
//   if (adNotice) {
//     adNotice.textContent = message || '';
//     adNotice.style.display = message ? 'block' : 'none';
//   }
// }
// function showAdQuotaMessage(text) {
//   let el = document.getElementById('adQuotaSummary');
//   if (!el) {
//     const container = document.getElementById('ads-tab');
//     if (!container) return;
//     el = document.createElement('p');
//     el.id = 'adQuotaSummary';
//     el.style.marginTop = '8px';
//     el.style.color = '#333';
//     container.insertBefore(el, container.firstChild.nextSibling);
//   }
//   el.textContent = text || '';
// }

// function updateAdsTabVisibility() {
//   const adsTab = document.getElementById('tab-ads');
//   const logged = getLoggedPlace();
//   if (!adsTab) return;
//   if (logged && logged.id) {
//     adsTab.style.display = 'block';
//   } else {
//     adsTab.style.display = 'none';
//     const activeTab = document.querySelector('.tab.active');
//     if (!activeTab || activeTab.id === 'tab-ads') {
//       const placesTabEl = document.getElementById('tab-places');
//       if (placesTabEl) {
//         placesTabEl.classList.add('active');
//         showTab('places');
//       }
//     }
//   }
// }

// /* Fetch place */
// async function fetchPlace(placeId) {
//   if (!API_URL || !API_URL.startsWith('http')) return null;
//   const payload = { action: 'getDashboard', placeId: placeId };
//   const resp = await apiPost(payload);
//   if (!resp.ok) return null;
//   const data = resp.data;
//   if (!data || data.success === false) return null;
//   return (data.data && data.data.place) ? data.data.place : null;
// }

// /* Auth */
// function setupAuthUI() {
//   const loginBtn = document.getElementById('loginBtn');
//   const logoutBtn = document.getElementById('logoutBtn');
//   const loginModal = document.getElementById('loginModal');
//   const loginCancel = document.getElementById('loginCancel');
//   const loginForm = document.getElementById('loginForm');
//   if (loginBtn) loginBtn.addEventListener('click', () => { if (loginModal) loginModal.style.display = 'flex'; });
//   if (loginCancel) loginCancel.addEventListener('click', () => { if (loginModal) loginModal.style.display = 'none'; });
//   if (loginModal) loginModal.addEventListener('click', ev => { if (ev.target === loginModal) loginModal.style.display = 'none'; });
//   if (loginForm) loginForm.addEventListener('submit', handleLoginSubmit);
//   if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
//   const stored = getLoggedPlace();
//   if (stored) setLoggedInUI(stored);
//   if (typeof updateAdsTabVisibility === 'function') updateAdsTabVisibility();
// }

// function getLoggedPlace() {
//   try {
//     const raw = localStorage.getItem('khedmatak_place');
//     return raw ? JSON.parse(raw) : null;
//   } catch {
//     return null;
//   }
// }
// function setLoggedPlace(obj) {
//   try {
//     localStorage.setItem('khedmatak_place', JSON.stringify(obj));
//   } catch {}
// }
// function clearLoggedPlace() {
//   localStorage.removeItem('khedmatak_place');
// }

// async function setLoggedInUI(place) {
//   const loginBtn = document.getElementById('loginBtn');
//   const logoutBtn = document.getElementById('logoutBtn');
//   const loggedInUser = document.getElementById('loggedInUser');
//   if (loginBtn) loginBtn.style.display = 'none';
//   if (logoutBtn) logoutBtn.style.display = 'inline-block';
//   if (loggedInUser) {
//     loggedInUser.style.display = 'inline-block';
//     const name = (place && (place.name || (place.raw && place.raw['اسم المكان']))) || 'صاحب المحل';
//     loggedInUser.textContent = name;
//   }
//   const loginModal = document.getElementById('loginModal');
//   if (loginModal) loginModal.style.display = 'none';

//   if (place && !place.name && place.raw && place.raw['اسم المكان']) {
//     place.name = place.raw['اسم المكان'];
//   }

//   setLoggedPlace(place);
//   await loadLookupsAndPopulate().catch(() => {});
//   await tryPrefillPlaceForm(place);
//   const tabAds = document.getElementById('tab-ads');
//   if (tabAds) tabAds.style.display = 'block';
//   const placeSelects = document.querySelectorAll('select[name="placeId"]');
//   placeSelects.forEach(ps => {
//     ps.value = place.id;
//     ps.disabled = true;
//   });
//   if (typeof updateAdsTabVisibility === 'function') updateAdsTabVisibility();
//   if (place.id) {
//     if (typeof checkAdQuotaAndToggle === 'function') checkAdQuotaAndToggle(place.id);
//     if (typeof loadAdsForPlace === 'function') loadAdsForPlace(place.id);
//   }

//   try { showPlaceStatusBar(place); } catch (e) { console.warn('could not show status bar', e); }
// }

// function setLoggedOutUI() {
//   const loginBtn = document.getElementById('loginBtn');
//   const logoutBtn = document.getElementById('logoutBtn');
//   const loggedInUser = document.getElementById('loggedInUser');
//   if (loginBtn) loginBtn.style.display = 'inline-block';
//   if (logoutBtn) logoutBtn.style.display = 'none';
//   if (loggedInUser) {
//     loggedInUser.style.display = 'none';
//     loggedInUser.textContent = '';
//   }
//   clearLoggedPlace();
//   hidePlaceStatusBar();
//   const tabAds = document.getElementById('tab-ads');
//   if (tabAds) tabAds.style.display = 'none';
//   const placeSelects = document.querySelectorAll('select[name="placeId"]');
//   placeSelects.forEach(ps => { ps.disabled = false; });
//   if (typeof updateAdsTabVisibility === 'function') updateAdsTabVisibility();
// }

// async function handleLoginSubmit(ev) {
//   ev.preventDefault();
//   showLoading(true);
//   try {
//     const form = ev.target;
//     const phoneOrId = form.querySelector('input[name="phoneOrId"]').value.trim();
//     const password = form.querySelector('input[name="password"]').value || '';
//     if (!phoneOrId || !password) {
//       showError('ادخل رقم/ID وكلمة المرور');
//       showLoading(false);
//       return;
//     }
//     const payload = { action: 'loginPlace', phoneOrId, password };
//     const resp = await apiPost(payload);
//     if (!resp.ok) throw new Error('خطأ في التواصل مع الخادم');
//     const data = resp.data;
//     if (!data || data.success === false) throw new Error((data && data.error) ? data.error : JSON.stringify(data));
//     const returned = (data && data.data) ? data.data : data;

//     let placeObj = null;
//     if (returned.place) placeObj = returned.place;
//     else if (returned && returned.id) placeObj = returned;

//     if (!placeObj) throw new Error('استجابة غير متوقعة من الخادم عند تسجيل الدخول');

//     if (!placeObj.name && placeObj.raw && placeObj.raw['اسم المكان']) {
//       placeObj.name = placeObj.raw['اسم المكان'];
//     }

//     await setLoggedInUI(placeObj);
//     showSuccess('تم تسجيل الدخول');
//     return;
//   } catch (err) {
//     console.error('Login error detailed:', err);
//     showError(err.message || 'خطأ أثناء الدخول');
//   } finally {
//     showLoading(false);
//   }
// }
// function handleLogout() {
//   setLoggedOutUI();
//   showSuccess('تم تسجيل الخروج');
// }

// /* Place status bar */
// function initPlaceStatusButtons() {
//   const container = document.getElementById('placeStatusButtons');
//   if (!container) return;
//   container.querySelectorAll('.status-btn').forEach(btn => {
//     const clone = btn.cloneNode(true);
//     btn.parentNode.replaceChild(clone, btn);
//   });
//   const buttons = document.querySelectorAll('#placeStatusButtons .status-btn');
//   buttons.forEach(btn => {
//     btn.addEventListener('click', async () => {
//       const status = btn.dataset.status;
//       if (!status) return;
//       await updatePlaceStatus(status, btn);
//     });
//   });
// }
// function showPlaceStatusBar(place) {
//   const bar = document.getElementById('placeStatusBar');
//   const msg = document.getElementById('placeStatusMessage');
//   if (!bar) return;
//   if (!place || !place.id) {
//     bar.style.display = 'none';
//     if (msg) msg.textContent = '';
//     return;
//   }
//   bar.style.display = 'block';
//   const current = (place.status && String(place.status).trim() !== '')
//     ? place.status
//     : (place.raw && (place.raw['حالة المكان'] || place.raw['حالة التسجيل']))
//       ? (place.raw['حالة المكان'] || place.raw['حالة التسجيل'])
//       : '';
//   const buttons = document.querySelectorAll('#placeStatusButtons .status-btn');
//   buttons.forEach(b => {
//     b.classList.toggle('active', b.dataset.status === current);
//     b.disabled = false;
//     b.textContent = b.dataset.status;
//   });
//   if (msg) msg.textContent = current ? `الحالة الحالية: ${current}` : 'الحالة غير محددة';
//   initPlaceStatusButtons();
// }
// function hidePlaceStatusBar() {
//   const bar = document.getElementById('placeStatusBar');
//   const msg = document.getElementById('placeStatusMessage');
//   if (bar) bar.style.display = 'none';
//   if (msg) msg.textContent = '';
// }
// async function updatePlaceStatus(newStatus, btnElement = null) {
//   let originalText = null;
//   try {
//     const logged = getLoggedPlace();
//     const placeId = (logged && logged.id) ? logged.id : (logged && logged.placeId) ? logged.placeId : null;
//     if (!placeId) throw new Error('لا يوجد مكان مسجّل للدخول');

//     const current = (logged && logged.status)
//       ? logged.status
//       : (logged && logged.raw && (logged.raw['حالة المكان'] || logged.raw['حالة التسجيل']))
//         ? (logged.raw['حالة المكان'] || logged.raw['حالة التسجيل'])
//         : '';
//     if (String(current) === String(newStatus)) {
//       document.querySelectorAll('#placeStatusButtons .status-btn').forEach(b => {
//         b.classList.toggle('active', b.dataset.status === newStatus);
//       });
//       const msg = document.getElementById('placeStatusMessage');
//       if (msg) msg.textContent = `الحالة: ${newStatus}`;
//       return;
//     }

//     const buttons = document.querySelectorAll('#placeStatusButtons .status-btn');
//     buttons.forEach(b => b.disabled = true);

//     if (btnElement) {
//       originalText = btnElement.textContent;
//       btnElement.textContent = 'جاري الحفظ...';
//     }

//     const payload = { action: 'updatePlace', placeId: placeId, status: newStatus };
//     const resp = await apiPost(payload);
//     if (!resp.ok) throw new Error('فشل في التواصل مع الخادم');
//     const data = resp.data;
//     if (!data || data.success === false) throw new Error((data && data.error) ? data.error : 'استجابة غير متوقعة');

//     const stored = getLoggedPlace() || {};
//     stored.status = newStatus;
//     if (!stored.raw) stored.raw = {};
//     stored.raw['حالة المكان'] = newStatus;
//     stored.raw['حالة التسجيل'] = newStatus;
//     setLoggedPlace(stored);

//     buttons.forEach(b => {
//       b.classList.toggle('active', b.dataset.status === newStatus);
//       b.disabled = false;
//       b.textContent = b.dataset.status;
//     });

//     if (btnElement && originalText !== null) btnElement.textContent = btnElement.dataset.status;
//     const msg = document.getElementById('placeStatusMessage');
//     if (msg) msg.textContent = `تم التحديث إلى: ${newStatus}`;

//     showSuccess('تم تحديث حالة المكان');
//   } catch (err) {
//     console.error('updatePlaceStatus error', err);
//     showError(err.message || 'فشل تحديث حالة المكان');
//     document.querySelectorAll('#placeStatusButtons .status-btn').forEach(b => {
//       b.disabled = false;
//       b.textContent = b.dataset.status;
//     });
//     if (btnElement && originalText !== null) btnElement.textContent = originalText;
//   }
// }

// /* Map helpers */
// function parseLatLngFromMapLink(url) {
//   if (!url || typeof url !== 'string') return null;
//   try {
//     url = url.trim();
//     let m = url.match(/@(-?\d+\.\d+),\s*(-?\d+\.\d+)/);
//     if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
//     m = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
//     if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
//     m = url.match(/[?&]q=(-?\d+\.\د+),(-?\d+\.\d+)/); // قد لا يطابق كل الأنماط لكن لدينا بدائل أدناه
//     if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
//     m = url.match(/[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/);
//     if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
//     m = url.match(/[?&]mlat=(-?\d+\.\d+)&mlon=(-?\d+\.\d+)/);
//     if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
//     m = url.match(/#map=\d+\/(-?\d+\.\d+)\/(-?\d+\.\d+)/);
//     if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
//     m = url.match(/(-?\d+\.\d+)[, ]\s*(-?\d+\.\d+)/);
//     if (m) {
//       const lat = parseFloat(m[1]), lng = parseFloat(m[2]);
//       if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) return { lat, lng };
//     }
//   } catch (e) { console.warn('parseLatLngFromMapLink error', e); }
//   return null;
// }
// async function reverseGeocodeNominatim(lat, lng) {
//   try {
//     const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&addressdetails=1`;
//     const res = await fetch(url, { headers: { 'Accept': 'application/json', 'User-Agent': 'Khedmatak-App/1.0 (contact@example.com)' } });
//     if (!res.ok) return null;
//     return await res.json();
//   } catch (e) { console.warn('reverseGeocodeNominatim error', e); return null; }
// }
// async function autoFillFromMapLink(url) {
//   if (!url || String(url).trim() === '') return;
//   const coords = parseLatLngFromMapLink(url);
//   if (!coords) return;
//   const geo = await reverseGeocodeNominatim(coords.lat, coords.lng);
//   if (!geo) return;
//   const detailed = geo.display_name || '';
//   const address = geo.address || {};
//   const detailedEl = document.querySelector('input[name="detailedAddress"]');
//   if (detailedEl && (!detailedEl.value || detailedEl.value.trim() === '')) detailedEl.value = detailed;
//   const cityCandidates = [address.city, address.town, address.village, address.county, address.state];
//   const areaCandidates = [address.suburb, address.neighbourhood, address.hamlet, address.village, address.city_district];
//   const cityVal = cityCandidates.find(Boolean);
//   const areaVal = areaCandidates.find(Boolean);
//   if (cityVal) { await setSelectValueWhenReady('select[name="city"]', cityVal); try { updateAreas(); } catch {} }
//   if (areaVal) { await setSelectValueWhenReady('select[name="area"]', areaVal); }
// }
// function initMapLinkAutoFill() {
//   const mapInput = document.querySelector('input[name="mapLink"]');
//   if (!mapInput) return;
//   let timer = null;
//   const run = () => {
//     const v = mapInput.value;
//     if (v && v.trim() !== '') autoFillFromMapLink(v.trim());
//   };
//   mapInput.addEventListener('blur', run);
//   mapInput.addEventListener('input', () => {
//     if (timer) clearTimeout(timer);
//     timer = setTimeout(run, 900);
//   });
// }

// /* Auto geolocation */
// function buildGoogleMapsLink(lat, lng) {
//   return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lat + ',' + lng)}`;
// }
// async function handlePositionAndFill(lat, lng) {
//   try {
//     const mapEl = document.querySelector('input[name="mapLink"]') || document.getElementById('mapLinkInput');
//     if (mapEl) {
//       mapEl.value = buildGoogleMapsLink(lat, lng);
//       try { mapEl.dispatchEvent(new Event('input', { bubbles: true })); } catch {}
//       try { mapEl.dispatchEvent(new Event('change', { bubbles: true })); } catch {}
//     }
//     const geo = await reverseGeocodeNominatim(lat, lng);
//     if (!geo) return;
//     const detailed = geo.display_name || '';
//     const address = geo.address || {};
//     const detailedEl = document.querySelector('input[name="detailedAddress"]');
//     if (detailedEl && (!detailedEl.value || detailedEl.value.trim() === '')) detailedEl.value = detailed;
//     const cityCandidates = [address.city, address.town, address.village, address.county, address.state];
//     const areaCandidates = [address.suburb, address.neighbourhood, address.hamlet, address.village, address.city_district];
//     const cityVal = cityCandidates.find(Boolean);
//     if (cityVal) { await setSelectValueWhenReady('select[name="city"]', cityVal); try { updateAreas(); } catch {} }
//     const areaVal = areaCandidates.find(Boolean);
//     if (areaVal) { await setSelectValueWhenReady('select[name="area"]', areaVal); }
//   } catch (e) { console.error('handlePositionAndFill error', e); }
// }
// function requestGeolocationOnce(options = { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }) {
//   return new Promise((resolve, reject) => {
//     if (!navigator.geolocation) return reject(new Error('Geolocation not supported'));
//     navigator.geolocation.getCurrentPosition(pos => resolve(pos), err => reject(err), options);
//   });
// }
// async function attemptAutoLocate(showMessages = true) {
//   const mapInput = document.querySelector('input[name="mapLink"]') || document.getElementById('mapLinkInput');
//   if (mapInput && mapInput.value && mapInput.value.trim() !== '') return;
//   try {
//     if (showMessages) showSuccess('جاري محاولة تحديد موقعك...');
//     const pos = await requestGeolocationOnce();
//     const lat = pos.coords.latitude;
//     const lng = pos.coords.longitude;
//     await handlePositionAndFill(lat, lng);
//     if (showMessages) showSuccess('تم تحديد الموقع وملأ الحقول تلقائياً');
//   } catch (err) {
//     if (showMessages) showError('تعذر الحصول على الموقع. تأكد من منح الإذن أو اضغط "استخدم موقعي"');
//   }
// }
// function initMapAutoLocate() {
//   const btn = document.getElementById('autoLocateBtn');
//   if (btn) {
//     btn.addEventListener('click', async () => {
//       btn.disabled = true;
//       const old = btn.textContent;
//       btn.textContent = 'جاري تحديد الموقع...';
//       await attemptAutoLocate(true);
//       btn.disabled = false;
//       btn.textContent = old;
//     });
//   }
//   setTimeout(() => { try { attemptAutoLocate(false); } catch {} }, 900);
// }

// /* Small helpers */
// function setSelectByValueOrText(selectEl, val) {
//   if (!selectEl) return false;
//   const str = (val === null || val === undefined) ? '' : String(val).trim();
//   if (!str) return false;
//   for (let i = 0; i < selectEl.options.length; i++) {
//     const opt = selectEl.options[i];
//     if (String(opt.value) === str) { selectEl.value = opt.value; return true; }
//   }
//   for (let i = 0; i < selectEl.options.length; i++) {
//     const opt = selectEl.options[i];
//     if (String(opt.text).trim() === str) { selectEl.value = opt.value; return true; }
//   }
//   for (let i = 0; i < selectEl.options.length; i++) {
//     const opt = selectEl.options[i];
//     if (String(opt.text).toLowerCase().includes(str.toLowerCase())) { selectEl.value = opt.value; return true; }
//   }
//   return false;
// }
// function setSelectValueWhenReady(selector, val, retries = 12, interval = 200) {
//   return new Promise(resolve => {
//     if (!selector || val === null || val === undefined || String(val).trim() === '') { resolve(false); return; }
//     let attempts = 0;
//     const trySet = () => {
//       attempts++;
//       const sel = (typeof selector === 'string') ? document.querySelector(selector) : selector;
//       if (sel) {
//         const ok = setSelectByValueOrText(sel, val);
//         if (ok) { resolve(true); return; }
//       }
//       if (attempts >= retries) { resolve(false); return; }
//       setTimeout(trySet, interval);
//     };
//     trySet();
//   });
// }
// function showSuccess(message) {
//   const el = document.getElementById('successAlert');
//   if (!el) return;
//   el.textContent = message;
//   el.className = 'alert alert-success';
//   el.style.display = 'block';
//   setTimeout(() => el.style.display = 'none', 4000);
// }
// function showError(message) {
//   const el = document.getElementById('errorAlert');
//   if (!el) return;
//   el.textContent = message;
//   el.className = 'alert alert-error';
//   el.style.display = 'block';
//   setTimeout(() => el.style.display = 'none', 5000);
// }
// function showLoading(show) {
//   const el = document.getElementById('loading');
//   if (!el) return;
//   el.style.display = show ? 'block' : 'none';
// }

// /* Files validation */
// function validateFiles() {
//   const maxImageSize = 10 * 1024 * 1024;   // 10MB
//   const maxVideoSize = 50 * 1024 * 1024;   // 50MB
//   const allowedImageTypes = ['image/jpeg','image/png','image/gif','image/webp'];
//   const allowedVideoTypes = ['video/mp4','video/avi','video/mov','video/quicktime'];

//   for (let img of uploadedImages) {
//     if (img.size > maxImageSize) { showError('حجم الصورة أكبر من 10MB'); return false; }
//     if (!allowedImageTypes.includes(img.type)) { showError('نوع الصورة غير مدعوم'); return false; }
//   }
//   if (uploadedVideos.length > 0) {
//     const vid = uploadedVideos[0];
//     if (vid.size > maxVideoSize) { showError('حجم الفيديو أكبر من 50MB'); return false; }
//     if (!allowedVideoTypes.includes(vid.type)) { showError('نوع الفيديو غير مدعوم'); return false; }
//   }
//   return true;
// }

// /* Dates helpers */
// function parseDateISO(d) {
//   if (!d) return null;
//   try {
//     if (d instanceof Date) return d;
//     const s = String(d).trim();
//     if (!s) return null;
//     const parts = s.split('-');
//     if (parts.length === 3) {
//       const y = Number(parts[0]), m = Number(parts[1]) - 1, day = Number(parts[2]);
//       const dt = new Date(y, m, day);
//       dt.setHours(23,59,59,999);
//       return dt;
//     }
//     const dt2 = new Date(s);
//     return isNaN(dt2.getTime()) ? null : dt2;
//   } catch { return null; }
// }
// function daysBetween(from, to) {
//   if (!from || !to) return null;
//   const d1 = new Date(from.getFullYear(), from.getMonth(), from.getDate());
//   const d2 = new Date(to.getFullYear(), to.getMonth(), to.getDate());
//   const ms = d2 - d1;
//   return Math.ceil(ms / (1000 * 60 * 60 * 24));
// }
// function diffDaysHours(from, to) {
//   if (!from || !to) return { days: null, hours: null, ms: null };
//   let diff = to.getTime() - from.getTime();
//   if (diff < 0) diff = 0;
//   const dayMs = 1000*60*60*24;
//   const hourMs = 1000*60*60;
//   const days = Math.floor(diff / dayMs);
//   diff -= days * dayMs;
//   const hours = Math.floor(diff / hourMs);
//   return { days, hours, ms: to.getTime() - from.getTime() };
// }

// /* Package UI refresh */
// async function refreshPackageUIFromDashboard() {
//   try {
//     const logged = getLoggedPlace();

//     const card = document.getElementById('currentPackageCard');
//     const cardText = document.getElementById('currentPackageText');
//     const cardCountdown = document.getElementById('currentPackageCountdown');
//     const inlineCard = document.getElementById('packageInfoCard');
//     const inlineText = document.getElementById('packageInfoText');
//     const inlineCountdown = document.getElementById('packageInfoCountdown');

//     [card, inlineCard].forEach(c => { if (c) c.style.display = 'none'; });
//     [cardText, inlineText].forEach(t => { if (t) t.textContent = ''; });
//     [cardCountdown, inlineCountdown].forEach(cd => { if (cd) { cd.textContent = ''; cd.className = 'package-countdown'; clearInterval(cd._timer); } });

//     if (!logged || !logged.id) return;

//     const resp = await apiPost({ action: 'getDashboard', placeId: logged.id });
//     if (!resp.ok || !resp.data) return;
//     const payload = resp.data.data || resp.data;
//     const place = payload.place || null;
//     if (!place || !place.raw) return;

//     const pkgStatus = String(place.raw['حالة الباقة'] || place.raw['packageStatus'] || '').trim();
//     const pkgId = String(place.raw['الباقة'] || place.package || '').trim();
//     const startRaw = place.raw['تاريخ بداية الاشتراك'] || place.packageStart || '';
//     const endRaw = place.raw['تاريخ نهاية الاشتراك'] || place.packageEnd || '';
//     const startDate = parseDateISO(startRaw);
//     const endDate = parseDateISO(endRaw);
//     const today = new Date();

//     let packageName = '';
//     try {
//       if (window.lastLookups && Array.isArray(lastLookups.packages)) {
//         const f = lastLookups.packages.find(p => String(p.id) === pkgId);
//         if (f) packageName = f.name;
//       }
//     } catch {}

//     let remaining = (startDate && endDate) ? daysBetween(today, endDate) : null;
//     if (remaining !== null && remaining < 0) remaining = 0;

//     function setCountdown(el, end) {
//       if (!el || !end) return;
//       const update = () => {
//         const dh = diffDaysHours(new Date(), end);
//         const days = dh.days ?? 0;
//         const hours = dh.hours ?? 0;
//         el.textContent = `العدّاد: ${days} يوم و${hours} ساعة`;
//       };
//       update();
//       clearInterval(el._timer);
//       el._timer = setInterval(update, 60 * 1000);
//     }

//     const showCards = () => { [card, inlineCard].forEach(c => { if (c) c.style.display = 'block'; }); };

//     if (!pkgStatus) {
//       showCards();
//       if (cardText) cardText.textContent = 'باقتك الحالية: لا يوجد اشتراك';
//       if (inlineText) inlineText.textContent = 'باقتك الحالية: لا يوجد اشتراك';
//       return;
//     }
//     if (pkgStatus === 'مفعلة') {
//       showCards();
//       const pn = packageName || (pkgId ? `ID ${pkgId}` : 'غير معروفة');
//       const eTxt = endDate ? endDate.toISOString().split('T')[0] : '';
//       const remTxt = remaining !== null ? ` — المتبقي ${remaining} يوم` : '';
//       if (cardText) cardText.textContent = `باقتك الحالية: ${pn}${eTxt ? ` — تنتهي في ${eTxt}` : ''}${remTxt}`;
//       if (inlineText) inlineText.textContent = `باقتك الحالية: ${pn}${eTxt ? ` — تنتهي في ${eTxt}` : ''}${remTxt}`;
//       if (endDate) {
//         if (cardCountdown) setCountdown(cardCountdown, endDate);
//         if (inlineCountdown) setCountdown(inlineCountdown, endDate);
//       }
//       return;
//     }
//     if (pkgStatus === 'قيد الدفع') {
//       showCards();
//       const pn = packageName || (pkgId ? `ID ${pkgId}` : 'غير معروفة');
//       if (cardText) cardText.textContent = `باقتك الحالية: ${pn} — الحالة: قيد الدفع`;
//       if (inlineText) inlineText.textContent = `باقتك الحالية: ${pn} — الحالة: قيد الدفع`;
//       return;
//     }
//     if (pkgStatus === 'منتهية') {
//       showCards();
//       const pn = packageName || (pkgId ? `ID ${pkgId}` : 'غير معروفة');
//       const eTxt = endDate ? endDate.toISOString().split('T')[0] : '';
//       if (cardText) cardText.textContent = `باقتك الحالية: ${pn} — الحالة: منتهية${eTxt ? ` — انتهت في ${eTxt}` : ''}`;
//       if (inlineText) inlineText.textContent = `باقتك الحالية: ${pn} — الحالة: منتهية${eTxt ? ` — انتهت في ${eTxt}` : ''}`;
//       return;
//     }
//     // حالات أخرى
//     showCards();
//     const pn = packageName || (pkgId ? `ID ${pkgId}` : 'غير معروفة');
//     if (cardText) cardText.textContent = `باقتك الحالية: ${pn} — الحالة: ${pkgStatus}`;
//     if (inlineText) inlineText.textContent = `باقتك الحالية: ${pn} — الحالة: ${pkgStatus}`;
//   } catch (e) {
//     console.warn('refreshPackageUIFromDashboard error', e);
//   }
// }

// /* Trial logic */
// async function checkIfTrialIsUsed(placeId) {
//   try {
//     const payload = { action: 'getDashboard', placeId };
//     const resp = await apiPost(payload);
//     if (!resp.ok) return false;
//     const data = resp.data && resp.data.data ? resp.data.data : resp.data;
//     const place = data && data.place ? data.place : null;
//     if (!place || !place.raw) return false;
//     const trialUsed = String(place.raw['حالة الباقة التجريبية']).toLowerCase() === 'true';
//     const pkgStatus = String(place.raw['حالة الباقة'] || '').trim();
//     if (trialUsed && pkgStatus === 'منتهية') return true;
//     return false;
//   } catch (e) {
//     console.warn('checkIfTrialIsUsed error', e);
//     return false;
//   }
// }

// /* Choose package flow (with free=instant activation) */
// async function choosePackageAPI(packageId, options = {}) {
//   const logged = getLoggedPlace();
//   if (!logged || !logged.id) {
//     showError('يجب تسجيل الدخول أولاً');
//     return;
//   }
//   const price = Number(options.price || 0);
//   try {
//     if (price === 0) {
//       // تفعيل فوري للباقة المجانية
//       // ملاحظة: الأفضل أن يدعم الخادم action: 'activateFreePackage'
//       // إن لم يكن متوفراً، استخدم choosePackage مع free:true وتعامَل معه في الخادم
//       const resp = await apiPost({ action: 'choosePackage', placeId: logged.id, packageId, free: true });
//       // بديل: const resp = await apiPost({ action: 'choosePackage', placeId: logged.id, packageId, free: true });

//       if (!resp.ok) { showError('تعذر تفعيل الباقة المجانية'); return; }
//       const data = resp.data;
//       if (data && data.success === false) { showError(data.error || 'تعذر تفعيل الباقة المجانية'); return; }
//       const returned = (data && data.data) ? data.data : data;

//       const place = getLoggedPlace() || {};
//       place.raw = place.raw || {};
//       place.raw['الباقة'] = packageId;
//       place.raw['حالة الباقة'] = 'مفعلة'; // مفعّلة
//       if (returned && returned.start) place.raw['تاريخ بداية الاشتراك'] = returned.start;
//       if (returned && returned.end) place.raw['تاريخ نهاية الاشتراك'] = returned.end;
//       if (returned && returned.trialActivated) place.raw['حالة الباقة التجريبية'] = 'true';
//       setLoggedPlace(place);

//       showSuccess('تم تفعيل الباقة المجانية مباشرة');
//     } else {
//       // التدفق المعتاد للمدفوعة
//       const payload = { action: 'choosePackage', placeId: logged.id, packageId };
//       const resp = await apiPost(payload);
//       if (!resp.ok) { showError('فشل تغيير الباقة'); return; }
//       const data = resp.data;
//       if (!data || data.success === false) { showError((data && data.error) || 'فشل تغيير الباقة'); return; }

//       const returned = (data && data.data) ? data.data : data;
//       if (returned && (returned.pending || returned.pending === true)) {
//         const paymentId = returned.paymentId || returned.paymentID || returned.id;
//         const amount = returned.amount || returned.price || '';
//         const currency = returned.currency || 'SAR';
//         showPaymentModal({ paymentId, amount, currency, placeId: logged.id });
//         const place = getLoggedPlace() || {};
//         place.raw = place.raw || {};
//         place.raw['الباقة'] = packageId;
//         place.raw['حالة الباقة'] = 'قيد الدفع';
//         setLoggedPlace(place);
//         showSuccess('تم إنشاء طلب دفع. اتبع الإرشادات لإرسال إيصال الدفع.');
//       } else {
//         showSuccess(returned && returned.message ? returned.message : 'تم تغيير/تفعيل الباقة');
//         if (returned && returned.start && returned.end) {
//           const place = getLoggedPlace() || {};
//           if (!place.raw) place.raw = {};
//           place.raw['تاريخ بداية الاشتراك'] = returned.start;
//           place.raw['تاريخ نهاية الاشتراك'] = returned.end;
//           place.raw['الباقة'] = packageId;
//           place.raw['حالة الباقة'] = 'مفعلة';
//           if (returned.trialActivated) place.raw['حالة الباقة التجريبية'] = 'true';
//           setLoggedPlace(place);
//         }
//       }
//     }
//   } catch (err) {
//     console.error('choosePackageAPI error', err);
//     showError(err.message || 'فشل تغيير/تفعيل الباقة');
//   } finally {
//     await refreshPackageUIFromDashboard();
//     // إعادة بناء الشبكة لتحديث تمييز البطاقة ونصوص الأزرار
//     try { await loadLookupsAndPopulate(); } catch {}
//   }
// }

// /* Payment modal */
// function showPaymentModal({ paymentId, amount, currency, placeId }) {
//   const existing = document.getElementById('pm_modal');
//   if (existing) existing.remove();

//   const modal = document.createElement('div');
//   modal.id = 'pm_modal';
//   modal.style = `position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:9999;`;
//   modal.innerHTML = `
//     <div style="background:#fff;padding:18px;border-radius:10px;max-width:720px;width:95%;direction:rtl;color:#111">
//       <h3 style="margin-top:0">معلومات الدفع</h3>
//       ${paymentId ? `<p>معرف طلب الدفع: <strong id="pm_paymentId">${escapeHtml(paymentId)}</strong></p>` : '<p>لا يوجد معرف طلب دفع متاح حالياً.</p>'}
//       ${amount ? `<p>المبلغ المطلوب: <strong>${escapeHtml(String(amount))} ${escapeHtml(String(currency || 'SAR'))}</strong></p>` : ''}
//       <h4>طرق الدفع المتاحة</h4>
//       <div id="pm_methods" style="margin-bottom:8px"></div>
//       <label style="display:block;margin-top:8px">ارفق إيصال الدفع (صورة)</label>
//       <input type="file" id="pm_receipt" accept="image/*" style="display:block;margin:8px 0" />
//       <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px">
//         <button id="pm_cancel" class="btn btn-secondary">إلغاء</button>
//         <button id="pm_send" class="btn btn-primary">أرسل الإيصال</button>
//       </div>
//       <div id="pm_msg" style="margin-top:10px;color:#333"></div>
//     </div>
//   `;
//   document.body.appendChild(modal);

//   const methodsContainer = modal.querySelector('#pm_methods');
//   const methods = window.availablePaymentMethods || [];
//   if (methods && methods.length) {
//     methods.forEach(m => {
//       const div = document.createElement('div');
//       div.style = 'padding:8px;border-radius:6px;border:1px solid #eee;margin-bottom:6px;background:#fafafa';
//       const name = m.name || m['طرق الدفع'] || (m.raw && (m.raw['طرق الدفع'] || m.raw['طريقة الدفع'])) || 'طريقة دفع';
//       const id = (m.raw && (m.raw['معرف الدفع'] || m.id)) ? (m.raw['معرف الدفع'] || m.id) : '';
//       div.innerHTML = `<strong style="display:block">${escapeHtml(name)}</strong>${id ? `<div style="color:#666;margin-top:4px">تفاصيل: ${escapeHtml(String(id))}</div>` : ''}`;
//       methodsContainer.appendChild(div);
//     });
//   } else {
//     methodsContainer.textContent = 'لا توجد طرق دفع معرفة. تواصل مع الإدارة.';
//   }

//   const inputFile = modal.querySelector('#pm_receipt');
//   const btnCancel = modal.querySelector('#pm_cancel');
//   const btnSend = modal.querySelector('#pm_send');
//   const msg = modal.querySelector('#pm_msg');

//   btnCancel.addEventListener('click', () => modal.remove());

//   btnSend.addEventListener('click', async () => {
//     if (!inputFile.files || inputFile.files.length === 0) {
//       msg.textContent = 'الرجاء اختيار صورة الإيصال أولاً';
//       return;
//     }
//     btnSend.disabled = true;
//     btnSend.textContent = 'جاري الرفع...';
//     msg.textContent = '';

//     try {
//       const file = inputFile.files[0];
//       const base64 = await readFileAsBase64(file);

//       const uploadPayload = {
//         action: 'uploadMedia',
//         fileName: file.name,
//         mimeType: file.type,
//         fileData: base64,
//         placeId: placeId || ''
//       };
//       const uploadResp = await apiPost(uploadPayload);
//       if (!uploadResp.ok) throw new Error('فشل رفع الملف');
//       const upData = uploadResp.data && uploadResp.data.data ? uploadResp.data.data : uploadResp.data;
//       const fileUrl = (upData && (upData.fileUrl || upData.url)) || uploadResp.fileUrl || (uploadResp.data && uploadResp.data.fileUrl) || '';
//       if (!fileUrl) throw new Error('لم يتم الحصول على رابط الملف بعد الرفع');

//       if (paymentId) {
//         const updatePayload = {
//           action: 'updatePaymentRequest',
//           paymentId: paymentId,
//           updates: {
//             'رابط إيصال الدفع': fileUrl,
//             receiptUrl: fileUrl,
//             الحالة: 'receipt_uploaded',
//             ملاحظات: 'تم رفع إيصال من صاحب المحل'
//           }
//         };
//         const updateResp = await apiPost(updatePayload);
//         if (!updateResp.ok) throw new Error('تم رفع الإيصال لكن فشل ربطه بطلب الدفع.');
//       }

//       msg.textContent = 'تم إرسال الإيصال بنجاح. سيتم التحقق.';
//       setTimeout(() => modal.remove(), 1200);
//     } catch (err) {
//       msg.textContent = 'حدث خطأ أثناء الإرسال: ' + (err.message || err);
//       btnSend.disabled = false;
//       btnSend.textContent = 'أرسل الإيصال';
//     }
//   });
// }

// /* Prefill and helpers */
// async function tryPrefillPlaceForm(place) {
//   if (!place || !place.raw) return;
//   try {
//     const raw = place.raw;
//     const setInput = (selector, value) => {
//       const el = document.querySelector(selector);
//       if (el && (value !== undefined && value !== null)) el.value = value;
//     };

//     const name = raw['اسم المكان'] || place.name || '';
//     setInput('input[name="placeName"]', name);
//     setInput('input[name="password"]', raw['كلمة المرور'] || place.password || '');
//     setInput('input[name="detailedAddress"]', raw['العنوان التفصيلي'] || '');
//     setInput('input[name="mapLink"]', raw['رابط الموقع على الخريطة'] || '');
//     setInput('input[name="phone"]', raw['رقم التواصل'] || '');
//     setInput('input[name="whatsappLink"]', raw['رابط واتساب'] || '');
//     setInput('input[name="email"]', raw['البريد الإلكتروني'] || '');
//     setInput('input[name="website"]', raw['الموقع الالكتروني'] || '');
//     setInput('input[name="workingHours"]', raw['ساعات العمل'] || '');
//     setInput('textarea[name="description"]', raw['وصف مختصر '] || '');
//     await setSelectValueWhenReady('select[name="activityType"]', raw['نوع النشاط / الفئة'] || '');
//     await setSelectValueWhenReady('select[name="city"]', raw['المدينة'] || '');
//     if ((raw['المدينة'] || '') !== '') updateAreas();
//     await setSelectValueWhenReady('select[name="area"]', raw['المنطقة'] || '');
//     await setSelectValueWhenReady('select[name="location"]', raw['الموقع او المول'] || '');

//     const logoUrl = raw['رابط صورة شعار المكان'] || raw['صورة شعار أو صورة المكان'] || '';
//     if (logoUrl) {
//       const preview = document.getElementById('placeImagePreview');
//       if (preview) {
//         preview.innerHTML = '';
//         const img = document.createElement('img');
//         img.src = logoUrl;
//         preview.appendChild(img);
//       }
//     }

//     updateInlinePackageInfoCard(place);
//   } catch (e) {}
// }

// function updateInlinePackageInfoCard(place) {
//   try {
//     const card = document.getElementById('packageInfoCard');
//     const text = document.getElementById('packageInfoText');
//     const countdown = document.getElementById('packageInfoCountdown');
//     if (!card || !text || !countdown) return;
//     card.style.display = 'none';
//     text.textContent = '';
//     countdown.textContent = '';
//     clearInterval(countdown._timer);

//     const raw = place.raw || {};
//     const pkgStatus = String(raw['حالة الباقة'] || '').trim();
//     const pkgId = String(raw['الباقة'] || '').trim();
//     const startRaw = raw['تاريخ بداية الاشتراك'] || '';
//     const endRaw = raw['تاريخ نهاية الاشتراك'] || '';
//     const startDate = parseDateISO(startRaw);
//     const endDate = parseDateISO(endRaw);

//     let packageName = '';
//     try {
//       if (window.lastLookups && Array.isArray(lastLookups.packages)) {
//         const f = lastLookups.packages.find(p => String(p.id) === pkgId);
//         if (f) packageName = f.name;
//       }
//     } catch {}

//     if (!pkgStatus) {
//       card.style.display = 'block';
//       text.textContent = 'باقتك الحالية: لا يوجد اشتراك';
//       return;
//     }
//     if (pkgStatus === 'مفعلة') {
//       const today = new Date();
//       let remaining = (startDate && endDate) ? daysBetween(today, endDate) : null;
//       if (remaining !== null && remaining < 0) remaining = 0;
//       const pn = packageName || (pkgId ? `ID ${pkgId}` : 'غير معروفة');
//       const eTxt = endDate ? endDate.toISOString().split('T')[0] : '';
//       text.textContent = `باقتك الحالية: ${pn}${eTxt ? ` — تنتهي في ${eTxt}` : ''}${remaining !== null ? ` — المتبقي ${remaining} يوم` : ''}`;
//       card.style.display = 'block';
//       if (endDate) {
//         const update = () => {
//           const dh = diffDaysHours(new Date(), endDate);
//           const days = dh.days ?? 0;
//           const hours = dh.hours ?? 0;
//           countdown.textContent = `العدّاد: ${days} يوم و${hours} ساعة`;
//         };
//         update();
//         clearInterval(countdown._timer);
//         countdown._timer = setInterval(update, 60 * 1000);
//       }
//       return;
//     }
//     if (pkgStatus === 'قيد الدفع') {
//       const pn = packageName || (pkgId ? `ID ${pkgId}` : 'غير معروفة');
//       text.textContent = `باقتك الحالية: ${pn} — الحالة: قيد الدفع`;
//       card.style.display = 'block';
//       return;
//     }
//     if (pkgStatus === 'منتهية') {
//       const pn = packageName || (pkgId ? `ID ${pkgId}` : 'غير معروفة');
//       const eTxt = endDate ? endDate.toISOString().split('T')[0] : '';
//       text.textContent = `باقتك الحالية: ${pn} — الحالة: منتهية${eTxt ? ` — انتهت في ${eTxt}` : ''}`;
//       card.style.display = 'block';
//       return;
//     }
//     const pn = packageName || (pkgId ? `ID ${pkgId}` : 'غير معروفة');
//     text.textContent = `باقتك الحالية: ${pn} — الحالة: ${pkgStatus}`;
//     card.style.display = 'block';
//   } catch (e) {}
// }

// /* Utils */
// function escapeHtml(s) {
//   if (s === null || s === undefined) return '';
//   return String(s).replace(/[&<>"']/g, function(m){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[m]; });
// }


// const API_URL = 'https://script.google.com/macros/s/AKfycbwB0VE5COC0e6NQNKrxQeNRu2Mtt_QuMbVoBrH7tE6Da3X3BP6UxK926bt9fDO0WPU5/exec';

// // المتغيرات العامة
// let currentTab = 'places';
// let uploadedImages = [];
// let uploadedVideos = [];
// let editingAdId = null;
// const recentUploads = {};
// const THEME_KEY = 'khedmatak_theme';

// /* ========================= المظهر والثيم ========================= */
// function applyTheme(theme) {
//   if (theme === 'dark') {
//     document.body.classList.add('dark');
//     const icon = document.getElementById('themeIcon');
//     const lbl = document.getElementById('themeLabel');
//     if (icon) icon.className = 'fas fa-sun';
//     if (lbl) lbl.textContent = 'الوضع النهاري';
//   } else {
//     document.body.classList.remove('dark');
//     const icon = document.getElementById('themeIcon');
//     const lbl = document.getElementById('themeLabel');
//     if (icon) icon.className = 'fas fa-moon';
//     if (lbl) lbl.textContent = 'الوضع الليلي';
//   }
//   try { localStorage.setItem(THEME_KEY, theme || 'light'); } catch (e) {}
// }

// function toggleTheme() {
//   const current = localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light';
//   applyTheme(current === 'dark' ? 'light' : 'dark');
// }

// function initTheme() {
//   try {
//     const saved = localStorage.getItem(THEME_KEY);
//     if (saved) {
//       applyTheme(saved);
//     } else {
//       const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
//       applyTheme(prefersDark ? 'dark' : 'light');
//     }
//   } catch (e) { 
//     applyTheme('light'); 
//   }
// }

// /* ========================= API والتواصل ========================= */
// async function apiPost(payload) {
//   try {
//     let body;
//     let headers = {};
    
//     if (payload instanceof FormData) {
//       body = payload;
//     } else if (typeof payload === 'object' && payload !== null) {
//       const form = new FormData();
//       for (const k of Object.keys(payload)) {
//         const v = payload[k];
//         if (v !== null && typeof v === 'object') {
//           form.append(k, JSON.stringify(v));
//         } else {
//           form.append(k, v === undefined ? '' : String(v));
//         }
//       }
//       body = form;
//     } else {
//       headers['Content-Type'] = 'text/plain';
//       body = String(payload);
//     }

//     const response = await fetch(API_URL, { 
//       method: 'POST', 
//       body: body,
//       headers: headers
//     });
    
//     if (!response.ok) {
//       throw new Error(`HTTP Error: ${response.status}`);
//     }
    
//     const text = await response.text();
//     let data = null;
    
//     try {
//       data = JSON.parse(text);
//     } catch (parseError) {
//       console.warn('Response is not valid JSON:', text);
//       data = { success: false, error: 'استجابة غير صالحة من الخادم' };
//     }
    
//     return { 
//       ok: true, 
//       status: response.status, 
//       data: data, 
//       raw: text 
//     };
    
//   } catch (err) {
//     console.error('API Post Error:', err);
//     return { 
//       ok: false, 
//       status: 0, 
//       error: err.message || String(err),
//       data: { success: false, error: err.message || String(err) }
//     };
//   }
// }

// async function apiFetch(url, opts = {}) {
//   try {
//     const response = await fetch(url, opts);
//     const text = await response.text();
    
//     let data = null;
//     try { 
//       data = JSON.parse(text); 
//     } catch { 
//       data = text; 
//     }
    
//     return { 
//       ok: response.ok, 
//       status: response.status, 
//       data: data, 
//       raw: text 
//     };
//   } catch (err) {
//     return { 
//       ok: false, 
//       status: 0, 
//       error: err.message || String(err) 
//     };
//   }
// }

// /* ========================= التهيئة الرئيسية ========================= */
// document.addEventListener('DOMContentLoaded', () => {
//   initializeApp();
//   initTheme();
//   setupEventListeners();
//   loadLookupsAndPopulate();
//   setupAuthUI();
//   initMapFeatures();
  
//   const stored = getLoggedPlace();
//   if (stored && stored.id) {
//     showPlaceStatusBar(stored);
//   } else {
//     hidePlaceStatusBar();
//   }
  
//   updateAdsTabVisibility();
// });

// function initializeApp() {
//   const today = new Date().toISOString().split('T');
//   const nextWeek = new Date();
//   nextWeek.setDate(nextWeek.getDate() + 7);
  
//   const startInput = document.querySelector('input[name="startDate"]');
//   const endInput = document.querySelector('input[name="endDate"]');
  
//   if (startInput) startInput.value = today;
//   if (endInput) endInput.value = nextWeek.toISOString().split('T');
// }

// function setupEventListeners() {
//   const placeForm = document.getElementById('placeForm');
//   const adForm = document.getElementById('adForm');
//   const citySelect = document.querySelector('select[name="city"]');
//   const themeBtn = document.getElementById('themeToggleBtn');
//   const goPackagesBtn = document.getElementById('goPackagesBtn');

//   if (placeForm) placeForm.addEventListener('submit', handlePlaceSubmit);
//   if (adForm) adForm.addEventListener('submit', handleAdSubmit);
//   if (citySelect) citySelect.addEventListener('change', updateAreas);
//   if (themeBtn) themeBtn.addEventListener('click', toggleTheme);
  
//   if (goPackagesBtn) {
//     goPackagesBtn.addEventListener('click', () => {
//       const logged = getLoggedPlace();
//       if (!logged || !logged.id) {
//         showError('احفظ بيانات المكان أولاً للانتقال إلى الباقات');
//         return;
//       }
//       showTab('packages');
//     });
//   }
// }

// /* ========================= البيانات والقوائم ========================= */
// async function loadLookupsAndPopulate() {
//   try {
//     const resp = await apiFetch(`${API_URL}?action=getLookups`);
//     if (!resp.ok) {
//       console.warn('getLookups failed', resp);
//       return;
//     }
    
//     const json = resp.data;
//     const data = (json && json.success && json.data) ? json.data : json;
//     if (!data) return;

//     window.lastLookups = data;

//     // تعبئة قوائم الأمفعلة
//     populateSelect('select[name="activityType"]', data.activities, 'اختر نوع النشاط');
    
//     // تعبئة قوائم المدن
//     populateSelect('select[name="city"]', data.cities, 'اختر المدينة');
    
//     // إعداد خريطة المناطق
//     setupCityAreaMap(data.areas);
    
//     // تعبئة قوائم المواقع
//     populateSelect('select[name="location"]', data.sites, 'اختر الموقع');
    
//     // إعداد شبكة الباقات
//     setupPackagesGrid(data.packages);
    
//     // حفظ طرق الدفع
//     window.availablePaymentMethods = (data.paymentsMethods || []).map(pm => ({
//       id: pm.id || (pm.raw && pm.raw['معرف الدفع']),
//       name: pm.name || (pm.raw && (pm.raw['طرق الدفع'] || pm.raw['طريقة الدفع'])),
//       raw: pm.raw || pm
//     }));

//     // تحميل بيانات المكان المحفوظة
//     const stored = getLoggedPlace();
//     if (stored && stored.raw) {
//       await tryPrefillPlaceForm(stored);
//       if (stored.id) {
//         checkAdQuotaAndToggle(stored.id);
//         loadAdsForPlace(stored.id);
//       }
//     }

//     updateAdsTabVisibility();
//     await refreshPackageUI();
//     await loadPlacesForAds();
    
//   } catch (err) {
//     console.error('loadLookupsAndPopulate error', err);
//   }
// }

// function populateSelect(selector, items, defaultText) {
//   const select = document.querySelector(selector);
//   if (!select) return;
  
//   select.innerHTML = `<option value="">${defaultText}</option>`;
  
//   (items || []).forEach(item => {
//     const opt = document.createElement('option');
//     opt.value = item.id;
//     opt.textContent = item.name;
//     select.appendChild(opt);
//   });
// }

// function setupCityAreaMap(areas) {
//   const cityAreaMap = {};
//   (areas || []).forEach(area => {
//     const cityId = area.raw && (area.raw['ID المدينة'] || area.raw['cityId']) 
//       ? String(area.raw['ID المدينة'] || area.raw['cityId']) 
//       : '';
//     if (!cityAreaMap[cityId]) cityAreaMap[cityId] = [];
//     cityAreaMap[cityId].push({ id: area.id, name: area.name });
//   });
//   window.cityAreaMap = cityAreaMap;
// }

// function updateAreas() {
//   const citySelect = document.querySelector('select[name="city"]');
//   const areaSelect = document.querySelector('select[name="area"]');
  
//   if (!citySelect || !areaSelect) return;
  
//   areaSelect.innerHTML = '<option value="">اختر المنطقة</option>';
  
//   const selectedCity = citySelect.value;
//   if (selectedCity && window.cityAreaMap && window.cityAreaMap[selectedCity]) {
//     window.cityAreaMap[selectedCity].forEach(area => {
//       const opt = document.createElement('option');
//       opt.value = area.id;
//       opt.textContent = area.name;
//       areaSelect.appendChild(opt);
//     });
//   }
// }

// /* ========================= شبكة الباقات ========================= */
// function setupPackagesGrid(packages) {
//   const grid = document.getElementById('packagesGrid');
//   if (!grid) return;
  
//   grid.innerHTML = '';
//   const logged = getLoggedPlace();
//   const currentPkgId = logged && logged.raw ? String(logged.raw['الباقة'] || '') : '';
//   const currentPkgStatus = logged && logged.raw ? String(logged.raw['حالة الباقة'] || '').trim() : '';

//   (packages || []).forEach(pkg => {
//     const card = document.createElement('div');
//     card.className = 'pkg-card';
    
//     const duration = Number(pkg.duration || (pkg.raw && (pkg.raw['مدة الباقة باليوم'] || pkg.raw['مدة'])) || 0) || 0;
//     const price = Number(pkg.price || (pkg.raw && (pkg.raw['سعر الباقة'] || pkg.raw['السعر'])) || 0) || 0;
//     const allowedAds = Number(pkg.allowedAds || (pkg.raw && (pkg.raw['عدد الاعلانات'] || pkg.raw['عدد_الاعلانات'])) || 0) || 0;
    
//     const isCurrent = currentPkgId && String(pkg.id) === String(currentPkgId);
    
//     // تمييز البطاقة الحالية
//     if (isCurrent) {
//       card.style.border = '2px solid #10b981';
//       card.style.boxShadow = '0 6px 18px rgba(16,185,129,0.15)';
      
//       const badge = document.createElement('div');
//       badge.textContent = 'باقتك الحالية';
//       badge.style.cssText = `
//         display: inline-block;
//         background: #10b981;
//         color: #fff;
//         padding: 4px 8px;
//         border-radius: 999px;
//         margin-bottom: 8px;
//         font-size: 12px;
//         font-weight: 700;
//       `;
//       card.appendChild(badge);
//     }
    
//     // العنوان والتفاصيل
//     const title = document.createElement('h3');
//     title.textContent = pkg.name;
//     card.appendChild(title);
    
//     const details = document.createElement('p');
//     details.textContent = `المدة: ${duration} يوم • السعر: ${price} • الإعلانات: ${allowedAds}`;
//     card.appendChild(details);
    
//     if (pkg.raw && (pkg.raw['وصف الباقة'] || pkg.raw['description'])) {
//       const desc = document.createElement('p');
//       desc.textContent = pkg.raw['وصف الباقة'] || pkg.raw['description'];
//       card.appendChild(desc);
//     }
    
//     // زر الاختيار
//     const btn = document.createElement('button');
//     btn.className = 'choose-pkg';
    
//     // تحديد نص الزر
//     if (isCurrent && currentPkgStatus === 'مفعلة') {
//       btn.textContent = 'هذه باقتك';
//       btn.disabled = true;
//     } else if (isCurrent && currentPkgStatus === 'قيد الدفع') {
//       btn.textContent = 'قيد الدفع';
//       btn.disabled = true;
//     } else if (isCurrent && currentPkgStatus === 'منتهية') {
//       btn.textContent = 'إعادة التفعيل';
//     } else {
//       btn.textContent = price === 0 ? 'تفعيل فوري' : 'اختر الباقة';
//     }
    
//     btn.onclick = async () => {
//       const logged = getLoggedPlace();
//       if (!logged || !logged.id) {
//         showError('احفظ بيانات المكان أولاً');
//         return;
//       }
      
//       if (price === 0) {
//         const isBlocked = await checkIfTrialIsUsed(logged.id);
//         if (isBlocked) {
//           showError('الباقة التجريبية غير متاحة مرة أخرى بعد انتهاء اشتراك سابق');
//           return;
//         }
//       }
      
//       await choosePackage(pkg.id, price);
//     };
    
//     card.appendChild(btn);
//     grid.appendChild(card);
//   });
// }

// /* ========================= اختيار الباقات ========================= */
// async function choosePackage(packageId, price = 0) {
//   const logged = getLoggedPlace();
//   if (!logged || !logged.id) {
//     showError('يجب تسجيل الدخول أولاً');
//     return;
//   }
  
//   try {
//     const resp = await apiPost({ 
//       action: 'choosePackage', 
//       placeId: logged.id, 
//       packageId: packageId 
//     });
    
//     if (!resp.ok) {
//       showError('فشل تغيير الباقة');
//       return;
//     }
    
//     const data = resp.data;
//     if (!data || data.success === false) {
//       showError(data.error || 'فشل تغيير الباقة');
//       return;
//     }

//     const result = data.data || data;
    
//     if (result.pending) {
//       // باقة مدفوعة - إظهار نافذة الدفع
//       showPaymentModal({
//         paymentId: result.paymentId,
//         amount: result.amount,
//         currency: result.currency || 'SAR',
//         placeId: logged.id
//       });
      
//       // تحديث حالة الباقة محلياً
//       updateLocalPackageStatus(packageId, 'قيد الدفع');
//       showSuccess('تم إنشاء طلب دفع. اتبع الإرشادات لإرسال إيصال الدفع');
//     } else {
//       // باقة مجانية أو تفعيل مباشر
//       updateLocalPackageStatus(packageId, 'مفعلة', result);
//       showSuccess(result.message || 'تم تفعيل الباقة بنجاح');
//     }
    
//   } catch (err) {
//     console.error('choosePackage error', err);
//     showError(err.message || 'فشل تغيير الباقة');
//   } finally {
//     await refreshPackageUI();
//     await loadLookupsAndPopulate(); // إعادة بناء شبكة الباقات
//   }
// }

// function updateLocalPackageStatus(packageId, status, data = null) {
//   const place = getLoggedPlace() || {};
//   place.raw = place.raw || {};
  
//   place.raw['الباقة'] = packageId;
//   place.raw['حالة الباقة'] = status;
  
//   if (data) {
//     if (data.start) place.raw['تاريخ بداية الاشتراك'] = data.start;
//     if (data.end) place.raw['تاريخ نهاية الاشتراك'] = data.end;
//     if (data.trialActivated) place.raw['حالة الباقة التجريبية'] = 'true';
//   }
  
//   setLoggedPlace(place);
// }

// async function checkIfTrialIsUsed(placeId) {
//   try {
//     const resp = await apiPost({ action: 'getDashboard', placeId });
//     if (!resp.ok) return false;
    
//     const data = resp.data.data || resp.data;
//     const place = data.place;
//     if (!place || !place.raw) return false;
    
//     const trialUsed = String(place.raw['حالة الباقة التجريبية']).toLowerCase() === 'true';
//     const pkgStatus = String(place.raw['حالة الباقة'] || '').trim();
    
//     return trialUsed && pkgStatus === 'منتهية';
//   } catch (e) {
//     console.warn('checkIfTrialIsUsed error', e);
//     return false;
//   }
// }

// /* ========================= تسجيل الدخول والمصادقة ========================= */
// function setupAuthUI() {
//   const loginBtn = document.getElementById('loginBtn');
//   const logoutBtn = document.getElementById('logoutBtn');
//   const loginModal = document.getElementById('loginModal');
//   const loginCancel = document.getElementById('loginCancel');
//   const loginForm = document.getElementById('loginForm');

//   if (loginBtn) {
//     loginBtn.addEventListener('click', () => {
//       if (loginModal) loginModal.style.display = 'flex';
//     });
//   }
  
//   if (loginCancel) {
//     loginCancel.addEventListener('click', () => {
//       if (loginModal) loginModal.style.display = 'none';
//     });
//   }
  
//   if (loginModal) {
//     loginModal.addEventListener('click', ev => {
//       if (ev.target === loginModal) loginModal.style.display = 'none';
//     });
//   }
  
//   if (loginForm) loginForm.addEventListener('submit', handleLoginSubmit);
//   if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

//   // تحقق من وجود بيانات مسجلة مسبقاً
//   const stored = getLoggedPlace();
//   if (stored) {
//     setLoggedInUI(stored);
//   }
  
//   updateAdsTabVisibility();
// }

// async function handleLoginSubmit(ev) {
//   ev.preventDefault();
//   showLoading(true);
  
//   try {
//     const form = ev.target;
//     const phoneOrId = form.querySelector('input[name="phoneOrId"]').value.trim();
//     const password = form.querySelector('input[name="password"]').value.trim();
    
//     if (!phoneOrId || !password) {
//       showError('الرجاء إدخال رقم/ID وكلمة المرور');
//       return;
//     }

//     const resp = await apiPost({ 
//       action: 'loginPlace', 
//       phoneOrId: phoneOrId, 
//       password: password 
//     });
    
//     if (!resp.ok) {
//       throw new Error('خطأ في الاتصال بالخادم');
//     }

//     const data = resp.data;
    
//     if (!data || data.success === false) {
//       const errorMsg = (data && data.error) ? data.error : 'خطأ غير معروف';
//       throw new Error(errorMsg);
//     }

//     // استخراج بيانات المكان
//     let placeObj = null;
//     if (data.data && data.data.place) {
//       placeObj = data.data.place;
//     } else if (data.place) {
//       placeObj = data.place;
//     } else {
//       throw new Error('لم يتم العثور على بيانات المكان في الاستجابة');
//     }

//     if (!placeObj || !placeObj.id) {
//       throw new Error('بيانات المكان غير مكتملة');
//     }

//     await setLoggedInUI(placeObj);
//     showSuccess('تم تسجيل الدخول بنجاح');
    
//   } catch (err) {
//     console.error('Login error:', err);
//     showError(err.message || 'خطأ أثناء تسجيل الدخول');
//   } finally {
//     showLoading(false);
//   }
// }

// function handleLogout() {
//   setLoggedOutUI();
//   showSuccess('تم تسجيل الخروج');
// }

// async function setLoggedInUI(place) {
//   const loginBtn = document.getElementById('loginBtn');
//   const logoutBtn = document.getElementById('logoutBtn');
//   const loggedInUser = document.getElementById('loggedInUser');
//   const loginModal = document.getElementById('loginModal');

//   if (loginBtn) loginBtn.style.display = 'none';
//   if (logoutBtn) logoutBtn.style.display = 'inline-block';
//   if (loginModal) loginModal.style.display = 'none';
  
//   if (loggedInUser) {
//     loggedInUser.style.display = 'inline-block';
//     const name = (place && (place.name || (place.raw && place.raw['اسم المكان']))) || 'صاحب المحل';
//     loggedInUser.textContent = name;
//   }

//   // تطبيع اسم المكان
//   if (place && !place.name && place.raw && place.raw['اسم المكان']) {
//     place.name = place.raw['اسم المكان'];
//   }

//   setLoggedPlace(place);
  
//   await loadLookupsAndPopulate();
//   await tryPrefillPlaceForm(place);
  
//   // إظهار تبويب الإعلانات وضبط قوائم الأماكن
//   updateAdsTabVisibility();
  
//   const placeSelects = document.querySelectorAll('select[name="placeId"]');
//   placeSelects.forEach(select => {
//     select.value = place.id;
//     select.disabled = true;
//   });

//   if (place.id) {
//     checkAdQuotaAndToggle(place.id);
//     loadAdsForPlace(place.id);
//   }

//   showPlaceStatusBar(place);
// }

// function setLoggedOutUI() {
//   const loginBtn = document.getElementById('loginBtn');
//   const logoutBtn = document.getElementById('logoutBtn');
//   const loggedInUser = document.getElementById('loggedInUser');

//   if (loginBtn) loginBtn.style.display = 'inline-block';
//   if (logoutBtn) logoutBtn.style.display = 'none';
  
//   if (loggedInUser) {
//     loggedInUser.style.display = 'none';
//     loggedInUser.textContent = '';
//   }
  
//   clearLoggedPlace();
//   hidePlaceStatusBar();
  
//   updateAdsTabVisibility();
  
//   const placeSelects = document.querySelectorAll('select[name="placeId"]');
//   placeSelects.forEach(select => {
//     select.disabled = false;
//   });
// }

// function getLoggedPlace() {
//   try {
//     const raw = localStorage.getItem('khedmatak_place');
//     return raw ? JSON.parse(raw) : null;
//   } catch {
//     return null;
//   }
// }

// function setLoggedPlace(obj) {
//   try {
//     localStorage.setItem('khedmatak_place', JSON.stringify(obj));
//   } catch {}
// }

// function clearLoggedPlace() {
//   localStorage.removeItem('khedmatak_place');
// }

// /* ========================= حفظ المكان ========================= */
// async function handlePlaceSubmit(ev) {
//   ev.preventDefault();
//   showLoading(true);
  
//   const submitBtn = document.getElementById('savePlaceBtn');
//   const originalText = submitBtn ? submitBtn.innerHTML : '';
  
//   if (submitBtn) {
//     submitBtn.disabled = true;
//     submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحفظ...';
//   }
  
//   try {
//     const formData = new FormData(ev.target);
//     const placeData = extractPlaceFormData(formData);
    
//     if (!validateFiles()) {
//       return;
//     }

//     // رفع الصورة إذا وجدت
//     let imageUrl = '';
//     if (placeData.image) {
//       const logged = getLoggedPlace();
//       const placeId = (logged && logged.id) ? logged.id : null;
//       imageUrl = await uploadToGoogleDrive(placeData.image, 'places', placeId);
//     }

//     // إعداد البيانات للإرسال
//     const payload = buildPlacePayload(placeData, imageUrl);
    
//     const resp = await apiPost(payload);
//     if (!resp.ok) {
//       throw new Error('فشل في التواصل مع الخادم');
//     }
    
//     const data = resp.data;
//     if (!data || data.success === false) {
//       throw new Error(data.error || 'فشل حفظ المكان');
//     }

//     // معالجة الاستجابة
//     await handlePlaceSaveResponse(data);
    
//     showSuccess('تم حفظ المكان بنجاح!');
//     clearImagePreview();
    
//     await refreshPackageUI();
//     await loadPlacesForAds();
    
//   } catch (err) {
//     console.error('handlePlaceSubmit error', err);
//     showError(err.message || 'حدث خطأ أثناء حفظ المكان');
//   } finally {
//     showLoading(false);
//     if (submitBtn) {
//       submitBtn.disabled = false;
//       submitBtn.innerHTML = originalText || '<i class="fas fa-save"></i> حفظ';
//     }
//   }
// }

// function extractPlaceFormData(formData) {
//   return {
//     placeName: formData.get('placeName'),
//     password: formData.get('password'),
//     activityType: formData.get('activityType'),
//     city: formData.get('city'),
//     area: formData.get('area'),
//     location: formData.get('location'),
//     detailedAddress: formData.get('detailedAddress'),
//     mapLink: formData.get('mapLink'),
//     phone: formData.get('phone'),
//     whatsappLink: formData.get('whatsappLink'),
//     email: formData.get('email'),
//     website: formData.get('website'),
//     workingHours: formData.get('workingHours'),
//     delivery: formData.get('delivery'),
//     description: formData.get('description'),
//     image: uploadedImages || null
//   };
// }

// function buildPlacePayload(placeData, imageUrl) {
//   const logged = getLoggedPlace();
//   const payload = { 
//     action: (logged && logged.id) ? 'updatePlace' : 'registerPlace' 
//   };
  
//   if (logged && logged.id) {
//     payload.placeId = logged.id;
//   }

//   const fieldMap = {
//     name: placeData.placeName,
//     password: placeData.password,
//     activityId: placeData.activityType,
//     city: placeData.city,
//     area: placeData.area,
//     mall: placeData.location,
//     address: placeData.detailedAddress,
//     mapLink: placeData.mapLink,
//     phone: placeData.phone,
//     whatsappLink: placeData.whatsappLink,
//     email: placeData.email,
//     website: placeData.website,
//     hours: placeData.workingHours,
//     delivery: placeData.delivery,
//     description: placeData.description,
//     logoUrl: imageUrl
//   };

//   for (const [key, value] of Object.entries(fieldMap)) {
//     if (value !== undefined && value !== null && String(value).trim() !== '') {
//       payload[key] = value;
//     }
//   }

//   return payload;
// }

// async function handlePlaceSaveResponse(data) {
//   const returned = data.data || data;
  
//   if (returned.place) {
//     await setLoggedInUI(returned.place);
//   } else if (returned.id) {
//     const fetched = await fetchPlace(returned.id);
//     if (fetched) {
//       await setLoggedInUI(fetched);
//     }
//   }
  
//   const newLogged = getLoggedPlace();
//   if (newLogged && newLogged.id) {
//     checkAdQuotaAndToggle(newLogged.id);
//     loadAdsForPlace(newLogged.id);
//   }
// }

// async function fetchPlace(placeId) {
//   if (!placeId) return null;
  
//   try {
//     const resp = await apiPost({ action: 'getDashboard', placeId: placeId });
//     if (!resp.ok || !resp.data) return null;
    
//     const data = resp.data;
//     if (!data || data.success === false) return null;
    
//     return (data.data && data.data.place) ? data.data.place : null;
//   } catch (e) {
//     return null;
//   }
// }

// /* ========================= الإعلانات ========================= */
// async function loadPlacesForAds() {
//   const placeSelects = document.querySelectorAll('select[name="placeId"]');
//   placeSelects.forEach(select => {
//     select.innerHTML = '<option value="">اختر المكان</option>';
//   });
  
//   try {
//     const resp = await apiFetch(`${API_URL}?action=places`);
//     if (!resp.ok) {
//       updateAdsTabVisibility();
//       return;
//     }
    
//     const json = resp.data;
//     let places = [];
    
//     if (json && json.success && json.data && Array.isArray(json.data.places)) {
//       places = json.data.places;
//     } else if (json && Array.isArray(json.places)) {
//       places = json.places;
//     } else if (Array.isArray(json)) {
//       places = json;
//     }

//     places.forEach(place => {
//       placeSelects.forEach(select => {
//         const opt = document.createElement('option');
//         opt.value = place.id;
//         opt.textContent = place.name;
//         select.appendChild(opt);
//       });
//     });

//     // ضبط المكان المسجل دخوله
//     const logged = getLoggedPlace();
//     if (logged && logged.id) {
//       placeSelects.forEach(select => {
//         select.value = logged.id;
//         select.disabled = true;
//       });
//       loadAdsForPlace(logged.id);
//     } else {
//       placeSelects.forEach(select => {
//         select.disabled = false;
//       });
//     }
    
//   } catch (err) {
//     console.error('loadPlacesForAds error', err);
//   }
  
//   updateAdsTabVisibility();
// }

// async function loadAdsForPlace(placeId) {
//   if (!placeId) return;
  
//   try {
//     const resp = await apiFetch(`${API_URL}?action=ads&placeId=${encodeURIComponent(placeId)}`);
//     if (!resp.ok) {
//       console.warn('loadAdsForPlace failed', resp);
//       return;
//     }
    
//     const json = resp.data;
//     let ads = [];
    
//     if (json && json.success && json.data && json.data.ads) {
//       ads = json.data.ads;
//     } else if (json && json.ads) {
//       ads = json.ads;
//     }
    
//     renderAdsList(Array.isArray(ads) ? ads : []);
//   } catch (err) {
//     console.error('loadAdsForPlace error', err);
//   }
// }

// function renderAdsList(ads) {
//   const container = document.getElementById('adsListContainer');
//   if (!container) return;
  
//   container.innerHTML = '';
  
//   if (!ads || ads.length === 0) {
//     container.innerHTML = '<p>لا توجد إعلانات حالياً لهذا المحل.</p>';
//     return;
//   }
  
//   ads.forEach(ad => {
//     const card = createAdCard(ad);
//     container.appendChild(card);
//   });
// }

// function createAdCard(ad) {
//   const card = document.createElement('div');
//   card.className = 'ad-card';
  
//   // العنوان
//   const title = document.createElement('h4');
//   title.textContent = ad.title || '(بدون عنوان)';
//   card.appendChild(title);
  
//   // المعلومات الأساسية
//   const meta = document.createElement('div');
//   meta.className = 'meta';
//   meta.textContent = `${ad.startDate || ''} — ${ad.endDate || ''} • الحالة: ${ad.status || ''}`;
//   card.appendChild(meta);
  
//   // الوصف
//   const description = document.createElement('p');
//   description.textContent = ad.description || '';
//   card.appendChild(description);
  
//   // الصور
//   if (ad.images && ad.images.length > 0) {
//     const imagesContainer = createAdImages(ad.images);
//     card.appendChild(imagesContainer);
//   }
  
//   // أزرار التحكم
//   const actions = createAdActions(ad);
//   card.appendChild(actions);
  
//   return card;
// }

// function createAdImages(images) {
//   const container = document.createElement('div');
//   container.className = 'ad-images';
  
//   const imagesArray = Array.isArray(images) ? images : 
//     (typeof images === 'string' ? JSON.parse(images) : []);
  
//   imagesArray.forEach(image => {
//     let url = '', name = '';
    
//     if (image && typeof image === 'object') {
//       url = image.url || '';
//       name = image.name || '';
//     } else if (typeof image === 'string') {
//       name = image;
//       url = '';
//     }
    
//     if (!url && name && recentUploads[name]) {
//       url = recentUploads[name].url;
//     }
    
//     if (url) {
//       const img = document.createElement('img');
//       img.src = url;
//       img.alt = name || '';
//       container.appendChild(img);
//     }
//   });
  
//   return container;
// }

// function createAdActions(ad) {
//   const actions = document.createElement('div');
//   actions.className = 'ad-actions';
  
//   const editBtn = document.createElement('button');
//   editBtn.className = 'btn';
//   editBtn.textContent = 'تعديل';
//   editBtn.onclick = () => startEditAd(ad);
  
//   const deleteBtn = document.createElement('button');
//   deleteBtn.className = 'btn btn-secondary';
//   deleteBtn.textContent = 'حذف';
//   deleteBtn.onclick = () => deleteAdConfirm(ad.id);
  
//   actions.appendChild(editBtn);
//   actions.appendChild(deleteBtn);
  
//   return actions;
// }

// async function handleAdSubmit(ev) {
//   ev.preventDefault();
//   showLoading(true);
  
//   try {
//     const formData = new FormData(ev.target);
//     const adData = extractAdFormData(formData);
    
//     if (!validateFiles()) {
//       return;
//     }

//     // رفع الصور
//     const imageUrls = await uploadAdImages(adData.images);
    
//     // رفع الفيديو
//     let videoUrl = '';
//     if (adData.video) {
//       videoUrl = await uploadToGoogleDrive(adData.video, 'ads');
//     }

//     // تحضير البيانات للإرسال
//     const payload = buildAdPayload(adData, imageUrls, videoUrl);
    
//     if (editingAdId) {
//       await updateAd(payload);
//     } else {
//       await createNewAd(payload);
//     }
    
//     // تنظيف النموذج
//     clearAdForm(ev.target);
    
//   } catch (err) {
//     console.error('handleAdSubmit error', err);
//     showError(err.message || 'حدث خطأ أثناء حفظ الإعلان');
//   } finally {
//     showLoading(false);
//   }
// }

// function extractAdFormData(formData) {
//   return {
//     placeId: formData.get('placeId'),
//     adType: formData.get('adType'),
//     adTitle: formData.get('adTitle'),
//     coupon: formData.get('coupon'),
//     adDescription: formData.get('adDescription'),
//     startDate: formData.get('startDate'),
//     endDate: formData.get('endDate'),
//     adStatus: formData.get('adStatus'),
//     adActiveStatus: formData.get('adActiveStatus'),
//     images: uploadedImages,
//     video: uploadedVideos || null
//   };
// }

// async function uploadAdImages(images) {
//   const imageUrls = [];
//   const maxImages = Math.min(images.length, 8);
  
//   for (let i = 0; i < maxImages; i++) {
//     const file = images[i];
//     const url = await uploadToGoogleDrive(file, 'ads');
//     imageUrls.push({ name: file.name, url });
//     recentUploads[file.name] = { url, name: file.name };
//   }
  
//   return imageUrls;
// }

// function buildAdPayload(adData, imageUrls, videoUrl) {
//   const logged = getLoggedPlace();
//   const placeId = adData.placeId || (logged && logged.id) || '';
  
//   return {
//     placeId: placeId,
//     adType: adData.adType,
//     adTitle: adData.adTitle,
//     adDescription: adData.adDescription,
//     startDate: adData.startDate,
//     endDate: adData.endDate,
//     coupon: adData.coupon || '',
//     imageFiles: JSON.stringify(imageUrls.map(img => img.name || '')),
//     imageUrls: JSON.stringify(imageUrls.map(img => img.url || '')),
//     videoFile: adData.video ? (adData.video.name || '') : '',
//     videoUrl: videoUrl || '',
//     adStatus: adData.adStatus || '',
//     adActiveStatus: adData.adActiveStatus || ''
//   };
// }

// async function updateAd(payload) {
//   const resp = await apiPost({ 
//     action: 'updateAd', 
//     adId: editingAdId, 
//     ...payload 
//   });
  
//   if (!resp.ok) {
//     throw new Error('فشل تحديث الإعلان');
//   }
  
//   const data = resp.data;
//   if (data && data.success === false) {
//     throw new Error(data.error || 'فشل تحديث الإعلان');
//   }
  
//   showSuccess('تم تحديث الإعلان');
  
//   const logged = getLoggedPlace();
//   if (logged && logged.id) {
//     await loadAdsForPlace(logged.id);
//   }
  
//   editingAdId = null;
//   const submitBtn = document.querySelector('#adForm button[type="submit"]');
//   if (submitBtn) submitBtn.textContent = 'حفظ الإعلان';
// }

// async function createNewAd(payload) {
//   const resp = await apiPost({ action: 'addAd', ...payload });
  
//   if (!resp.ok) {
//     throw new Error('فشل حفظ الإعلان');
//   }
  
//   const data = resp.data;
//   if (data && data.success === false) {
//     throw new Error(data.error || 'فشل حفظ الإعلان');
//   }
  
//   showSuccess('تم حفظ الإعلان');
  
//   const logged = getLoggedPlace();
//   if (logged && logged.id) {
//     await checkAdQuotaAndToggle(logged.id);
//     await loadAdsForPlace(logged.id);
//   }
// }

// async function deleteAdConfirm(adId) {
//   if (!confirm('هل أنت متأكد من حذف هذا الإعلان؟ لا يمكن التراجع.')) {
//     return;
//   }
  
//   try {
//     const resp = await apiPost({ action: 'deleteAd', adId: adId });
    
//     if (!resp.ok) {
//       throw new Error('فشل حذف الإعلان');
//     }
    
//     const data = resp.data;
//     if (data && data.success === false) {
//       throw new Error(data.error || 'فشل حذف الإعلان');
//     }
    
//     showSuccess('تم حذف الإعلان');
    
//     const logged = getLoggedPlace();
//     if (logged && logged.id) {
//       checkAdQuotaAndToggle(logged.id);
//       loadAdsForPlace(logged.id);
//     }
//   } catch (err) {
//     console.error('deleteAd error', err);
//     showError(err.message || 'خطأ أثناء حذف الإعلان');
//   }
// }

// /* ========================= حصة الإعلانات ========================= */
// async function checkAdQuotaAndToggle(placeId) {
//   try {
//     if (!placeId) {
//       const tabAds = document.getElementById('tab-ads');
//       if (tabAds) tabAds.style.display = 'none';
//       return;
//     }
    
//     const resp = await apiFetch(`${API_URL}?action=remainingAds&placeId=${encodeURIComponent(placeId)}`);
//     if (!resp.ok) {
//       toggleAdFormAllowed(false, 'تعذر التحقق من الباقة');
//       return;
//     }
    
//     const data = resp.data.data || resp.data;
//     const remaining = Number(data.remaining || 0);
//     const allowed = Number(data.allowed || 0);
//     const used = Number(data.used || 0);
    
//     showAdQuotaMessage(`الإعلانات: الكل ${allowed} • المستخدمة ${used} • المتبقي ${remaining}`);
//     toggleAdFormAllowed(remaining > 0, remaining > 0 ? '' : 'استنفدت حصة الإعلانات');
    
//   } catch (err) {
//     console.error('checkAdQuotaAndToggle', err);
//     toggleAdFormAllowed(false, 'خطأ أثناء التحقق');
//   }
// }

// function toggleAdFormAllowed(allowed, message) {
//   const adForm = document.getElementById('adForm');
//   if (!adForm) return;
  
//   const submitBtn = adForm.querySelector('button[type="submit"]');
//   if (submitBtn) {
//     submitBtn.disabled = !allowed;
//     submitBtn.style.opacity = allowed ? '1' : '0.6';
//     submitBtn.title = allowed ? '' : (message || 'غير مسموح');
//   }
  
//   updateAdQuotaNotice(message);
// }

// function updateAdQuotaNotice(message) {
//   let notice = document.getElementById('adQuotaNotice');
  
//   if (!notice) {
//     const container = document.getElementById('ads-tab');
//     if (!container) return;
    
//     notice = document.createElement('div');
//     notice.id = 'adQuotaNotice';
//     notice.style.cssText = `
//       background: #fff3cd;
//       color: #856404;
//       padding: 10px;
//       border-radius: 6px;
//       margin-top: 12px;
//       display: none;
//     `;
//     container.insertBefore(notice, container.firstChild.nextSibling);
//   }
  
//   notice.textContent = message || '';
//   notice.style.display = message ? 'block' : 'none';
// }

// function showAdQuotaMessage(text) {
//   let element = document.getElementById('adQuotaSummary');
  
//   if (!element) {
//     const container = document.getElementById('ads-tab');
//     if (!container) return;
    
//     element = document.createElement('p');
//     element.id = 'adQuotaSummary';
//     element.style.cssText = 'margin-top: 8px; color: #333;';
//     container.insertBefore(element, container.firstChild.nextSibling);
//   }
  
//   element.textContent = text || '';
// }

// function updateAdsTabVisibility() {
//   const adsTab = document.getElementById('tab-ads');
//   if (!adsTab) return;
  
//   const logged = getLoggedPlace();
  
//   if (logged && logged.id) {
//     adsTab.style.display = 'block';
//   } else {
//     adsTab.style.display = 'none';
    
//     // إذا كان التبويب الحالي هو الإعلانات، انتقل للأماكن
//     const activeTab = document.querySelector('.tab.active');
//     if (!activeTab || activeTab.id === 'tab-ads') {
//       showTab('places');
//     }
//   }
// }

// /* ========================= المعاينات والرفع ========================= */
// function previewImage(input, previewId) {
//   const preview = document.getElementById(previewId);
//   if (!preview) return;
  
//   preview.innerHTML = '';
  
//   if (input.files && input.files) {
//     const file = input.files;
//     const reader = new FileReader();
    
//     reader.onload = e => {
//       const img = document.createElement('img');
//       img.src = e.target.result;
//       preview.appendChild(img);
//       uploadedImages = [file];
//     };
    
//     reader.readAsDataURL(file);
//   }
// }

// function previewMultipleImages(input, previewId) {
//   const preview = document.getElementById(previewId);
//   if (!preview) return;
  
//   preview.innerHTML = '';
//   uploadedImages = [];
  
//   if (!input.files) return;
  
//   const files = Array.from(input.files).slice(0, 8);
//   if (input.files.length > 8) {
//     showError('يمكن تحميل حتى 8 صور كحد أقصى. سيتم أخذ أول 8 صور.');
//   }
  
//   files.forEach(file => {
//     const reader = new FileReader();
    
//     reader.onload = e => {
//       const container = document.createElement('div');
//       container.className = 'preview-image';
      
//       const img = document.createElement('img');
//       img.src = e.target.result;
      
//       const removeBtn = document.createElement('button');
//       removeBtn.className = 'remove-image';
//       removeBtn.innerHTML = '×';
//       removeBtn.onclick = () => {
//         container.remove();
//         uploadedImages = uploadedImages.filter(f => f !== file);
//       };
      
//       container.appendChild(img);
//       container.appendChild(removeBtn);
//       preview.appendChild(container);
//       uploadedImages.push(file);
//     };
    
//     reader.readAsDataURL(file);
//   });
// }

// function previewVideo(input, previewId) {
//   const preview = document.getElementById(previewId);
//   if (!preview) return;
  
//   preview.innerHTML = '';
//   uploadedVideos = [];
  
//   if (input.files && input.files) {
//     const file = input.files;
//     const reader = new FileReader();
    
//     reader.onload = e => {
//       const video = document.createElement('video');
//       video.src = e.target.result;
//       video.controls = true;
//       video.style.width = '100%';
//       preview.appendChild(video);
//       uploadedVideos = [file];
//     };
    
//     reader.readAsDataURL(file);
//   }
// }

// async function readFileAsBase64(file) {
//   return new Promise((resolve, reject) => {
//     const reader = new FileReader();
    
//     reader.onload = () => {
//       const result = reader.result;
//       const base64 = String(result).split(',')[1] || '';
//       resolve(base64);
//     };
    
//     reader.onerror = reject;
//     reader.readAsDataURL(file);
//   });
// }

// async function uploadToGoogleDrive(file, folder, placeId = null) {
//   if (!API_URL || !API_URL.startsWith('http')) {
//     return `https://drive.google.com/file/d/${Math.random().toString(36).substr(2, 9)}/view`;
//   }
  
//   const base64 = await readFileAsBase64(file);
  
//   const form = new FormData();
//   form.append('action', 'uploadFile');
//   form.append('folder', folder);
//   form.append('fileName', file.name);
//   form.append('mimeType', file.type || 'application/octet-stream');
//   form.append('fileData', base64);
  
//   if (placeId) {
//     form.append('placeId', placeId);
//   }
  
//   const resp = await apiPost(form);
  
//   if (!resp.ok) {
//     throw new Error('فشل رفع الملف');
//   }
  
//   const data = resp.data;
//   const uploadResult = (data && data.data) ? data.data : data;
//   const fileUrl = (uploadResult && (uploadResult.fileUrl || uploadResult.url)) || '';
  
//   if (fileUrl) {
//     recentUploads[file.name] = { url: fileUrl, name: file.name };
//   }
  
//   if (!fileUrl) {
//     throw new Error('تعذر استخراج رابط الملف من استجابة الخادم');
//   }
  
//   return fileUrl;
// }

// function validateFiles() {
//   const maxImageSize = 10 * 1024 * 1024;   // 10MB
//   const maxVideoSize = 50 * 1024 * 1024;   // 50MB
//   const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
//   const allowedVideoTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/quicktime'];

//   for (let img of uploadedImages) {
//     if (img.size > maxImageSize) {
//       showError('حجم الصورة أكبر من 10MB');
//       return false;
//     }
//     if (!allowedImageTypes.includes(img.type)) {
//       showError('نوع الصورة غير مدعوم. الأنواع المسموحة: JPEG, PNG, GIF, WebP');
//       return false;
//     }
//   }
  
//   if (uploadedVideos.length > 0) {
//     const video = uploadedVideos;
//     if (video.size > maxVideoSize) {
//       showError('حجم الفيديو أكبر من 50MB');
//       return false;
//     }
//     if (!allowedVideoTypes.includes(video.type)) {
//       showError('نوع الفيديو غير مدعوم. الأنواع المسموحة: MP4, AVI, MOV');
//       return false;
//     }
//   }
  
//   return true;
// }

// /* ========================= خصائص الخريطة والموقع ========================= */
// function initMapFeatures() {
//   initMapLinkAutoFill();
//   initMapAutoLocate();
// }

// function initMapLinkAutoFill() {
//   const mapInput = document.querySelector('input[name="mapLink"]');
//   if (!mapInput) return;
  
//   let timer = null;
  
//   const processMapLink = () => {
//     const value = mapInput.value;
//     if (value && value.trim() !== '') {
//       autoFillFromMapLink(value.trim());
//     }
//   };
  
//   mapInput.addEventListener('blur', processMapLink);
//   mapInput.addEventListener('input', () => {
//     if (timer) clearTimeout(timer);
//     timer = setTimeout(processMapLink, 900);
//   });
// }

// function initMapAutoLocate() {
//   const btn = document.getElementById('autoLocateBtn');
//   if (!btn) return;
  
//   btn.addEventListener('click', async () => {
//     btn.disabled = true;
//     const originalText = btn.textContent;
//     btn.textContent = 'جاري تحديد الموقع...';
    
//     await attemptAutoLocate(true);
    
//     btn.disabled = false;
//     btn.textContent = originalText;
//   });
  
//   // محاولة تلقائية عند التحميل
//   setTimeout(() => {
//     try { 
//       attemptAutoLocate(false); 
//     } catch {} 
//   }, 900);
// }

// async function attemptAutoLocate(showMessages = true) {
//   const mapInput = document.querySelector('input[name="mapLink"]');
  
//   // لا تحاول إذا كان هناك رابط موجود
//   if (mapInput && mapInput.value && mapInput.value.trim() !== '') {
//     return;
//   }
  
//   try {
//     if (showMessages) {
//       showSuccess('جاري محاولة تحديد موقعك...');
//     }
    
//     const position = await getCurrentPosition();
//     const lat = position.coords.latitude;
//     const lng = position.coords.longitude;
    
//     await handlePositionAndFill(lat, lng);
    
//     if (showMessages) {
//       showSuccess('تم تحديد الموقع وملأ الحقول تلقائياً');
//     }
//   } catch (err) {
//     if (showMessages) {
//       showError('تعذر الحصول على الموقع. تأكد من منح الإذن أو اضغط "استخدم موقعي"');
//     }
//   }
// }

// function getCurrentPosition(options = { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }) {
//   return new Promise((resolve, reject) => {
//     if (!navigator.geolocation) {
//       reject(new Error('Geolocation not supported'));
//       return;
//     }
    
//     navigator.geolocation.getCurrentPosition(
//       position => resolve(position),
//       error => reject(error),
//       options
//     );
//   });
// }

// async function handlePositionAndFill(lat, lng) {
//   try {
//     // ملء رابط الخريطة
//     const mapInput = document.querySelector('input[name="mapLink"]');
//     if (mapInput) {
//       const googleMapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lat + ',' + lng)}`;
//       mapInput.value = googleMapsLink;
      
//       // إطلاق أحداث التغيير
//       mapInput.dispatchEvent(new Event('input', { bubbles: true }));
//       mapInput.dispatchEvent(new Event('change', { bubbles: true }));
//     }
    
//     // الحصول على معلومات العنوان
//     const geocodeData = await reverseGeocode(lat, lng);
//     if (!geocodeData) return;
    
//     const address = geocodeData.address || {};
//     const detailedAddress = geocodeData.display_name || '';
    
//     // ملء العنوان التفصيلي
//     const addressInput = document.querySelector('input[name="detailedAddress"]');
//     if (addressInput && (!addressInput.value || addressInput.value.trim() === '')) {
//       addressInput.value = detailedAddress;
//     }
    
//     // ملء المدينة
//     const cityOptions = [address.city, address.town, address.village, address.county, address.state];
//     const cityValue = cityOptions.find(Boolean);
//     if (cityValue) {
//       await setSelectValueWhenReady('select[name="city"]', cityValue);
//       updateAreas(); // تحديث المناطق
//     }
    
//     // ملء المنطقة
//     const areaOptions = [address.suburb, address.neighbourhood, address.hamlet, address.village, address.city_district];
//     const areaValue = areaOptions.find(Boolean);
//     if (areaValue) {
//       await setSelectValueWhenReady('select[name="area"]', areaValue);
//     }
    
//   } catch (e) {
//     console.error('handlePositionAndFill error', e);
//   }
// }

// async function reverseGeocode(lat, lng) {
//   try {
//     const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&addressdetails=1`;
//     const response = await fetch(url, {
//       headers: {
//         'Accept': 'application/json',
//         'User-Agent': 'Khedmatak-App/1.0 (contact@example.com)'
//       }
//     });
    
//     if (!response.ok) return null;
//     return await response.json();
//   } catch (e) {
//     console.warn('reverseGeocode error', e);
//     return null;
//   }
// }

// async function autoFillFromMapLink(url) {
//   if (!url || String(url).trim() === '') return;
  
//   const coords = parseLatLngFromMapLink(url);
//   if (!coords) return;
  
//   const geocodeData = await reverseGeocode(coords.lat, coords.lng);
//   if (!geocodeData) return;
  
//   const address = geocodeData.address || {};
//   const detailedAddress = geocodeData.display_name || '';
  
//   // ملء العنوان التفصيلي
//   const addressInput = document.querySelector('input[name="detailedAddress"]');
//   if (addressInput && (!addressInput.value || addressInput.value.trim() === '')) {
//     addressInput.value = detailedAddress;
//   }
  
//   // ملء المدينة والمنطقة
//   const cityOptions = [address.city, address.town, address.village, address.county, address.state];
//   const areaOptions = [address.suburb, address.neighbourhood, address.hamlet, address.village, address.city_district];
  
//   const cityValue = cityOptions.find(Boolean);
//   if (cityValue) {
//     await setSelectValueWhenReady('select[name="city"]', cityValue);
//     updateAreas();
//   }
  
//   const areaValue = areaOptions.find(Boolean);
//   if (areaValue) {
//     await setSelectValueWhenReady('select[name="area"]', areaValue);
//   }
// }

// function parseLatLngFromMapLink(url) {
//   if (!url || typeof url !== 'string') return null;
  
//   try {
//     url = url.trim();
    
//     // نماذج مختلفة لروابط الخرائط
//     const patterns = [
//       /@(-?\d+\.\d+),\s*(-?\d+\.\d+)/,
//       /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/,
//       /[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/,
//       /[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/,
//       /[?&]mlat=(-?\d+\.\d+)&mlon=(-?\d+\.\d+)/,
//       /#map=\d+\/(-?\d+\.\d+)\/(-?\d+\.\d+)/,
//       /(-?\d+\.\d+)[, ]\s*(-?\d+\.\d+)/
//     ];
    
//     for (const pattern of patterns) {
//       const match = url.match(pattern);
//       if (match) {
//         const lat = parseFloat(match[1]);
//         const lng = parseFloat(match[2]);
        
//         if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
//           return { lat, lng };
//         }
//       }
//     }
//   } catch (e) {
//     console.warn('parseLatLngFromMapLink error', e);
//   }
  
//   return null;
// }

// /* ========================= نافذة الدفع ========================= */
// function showPaymentModal({ paymentId, amount, currency, placeId }) {
//   // إزالة النافذة السابقة إن وجدت
//   const existing = document.getElementById('paymentModal');
//   if (existing) existing.remove();

//   const modal = document.createElement('div');
//   modal.id = 'paymentModal';
//   modal.style.cssText = `
//     position: fixed;
//     inset: 0;
//     background: rgba(0,0,0,0.5);
//     display: flex;
//     align-items: center;
//     justify-content: center;
//     z-index: 9999;
//   `;

//   modal.innerHTML = `
//     <div style="background:#fff;padding:18px;border-radius:10px;max-width:720px;width:95%;direction:rtl;color:#111">
//       <h3 style="margin-top:0">معلومات الدفع</h3>
//       ${paymentId ? `<p>معرف طلب الدفع: <strong>${escapeHtml(paymentId)}</strong></p>` : '<p>لا يوجد معرف طلب دفع متاح حالياً.</p>'}
//       ${amount ? `<p>المبلغ المطلوب: <strong>${escapeHtml(String(amount))} ${escapeHtml(String(currency || 'SAR'))}</strong></p>` : ''}
//       <h4>طرق الدفع المتاحة</h4>
//       <div id="paymentMethods" style="margin-bottom:8px"></div>
//       <label style="display:block;margin-top:8px">ارفق إيصال الدفع (صورة)</label>
//       <input type="file" id="paymentReceipt" accept="image/*" style="display:block;margin:8px 0" />
//       <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px">
//         <button id="paymentCancel" class="btn btn-secondary">إلغاء</button>
//         <button id="paymentSend" class="btn btn-primary">أرسل الإيصال</button>
//       </div>
//       <div id="paymentMessage" style="margin-top:10px;color:#333"></div>
//     </div>
//   `;

//   document.body.appendChild(modal);

//   // ملء طرق الدفع
//   const methodsContainer = modal.querySelector('#paymentMethods');
//   const methods = window.availablePaymentMethods || [];
  
//   if (methods && methods.length) {
//     methods.forEach(method => {
//       const div = document.createElement('div');
//       div.style.cssText = 'padding:8px;border-radius:6px;border:1px solid #eee;margin-bottom:6px;background:#fafafa';
      
//       const name = method.name || (method.raw && (method.raw['طرق الدفع'] || method.raw['طريقة الدفع'])) || 'طريقة دفع';
//       const details = (method.raw && (method.raw['معرف الدفع'] || method.id)) ? (method.raw['معرف الدفع'] || method.id) : '';
      
//       div.innerHTML = `
//         <strong style="display:block">${escapeHtml(name)}</strong>
//         ${details ? `<div style="color:#666;margin-top:4px">تفاصيل: ${escapeHtml(String(details))}</div>` : ''}
//       `;
//       methodsContainer.appendChild(div);
//     });
//   } else {
//     methodsContainer.textContent = 'لا توجد طرق دفع معرفة. تواصل مع الإدارة.';
//   }

//   // ربط الأحداث
//   const fileInput = modal.querySelector('#paymentReceipt');
//   const cancelBtn = modal.querySelector('#paymentCancel');
//   const sendBtn = modal.querySelector('#paymentSend');
//   const messageDiv = modal.querySelector('#paymentMessage');

//   cancelBtn.addEventListener('click', () => modal.remove());

//   sendBtn.addEventListener('click', async () => {
//     if (!fileInput.files || fileInput.files.length === 0) {
//       messageDiv.textContent = 'الرجاء اختيار صورة الإيصال أولاً';
//       return;
//     }

//     sendBtn.disabled = true;
//     sendBtn.textContent = 'جاري الرفع...';
//     messageDiv.textContent = '';

//     try {
//       const file = fileInput.files;
//       const base64 = await readFileAsBase64(file);

//       // رفع الملف
//       const uploadResp = await apiPost({
//         action: 'uploadMedia',
//         fileName: file.name,
//         mimeType: file.type,
//         fileData: base64,
//         placeId: placeId || ''
//       });

//       if (!uploadResp.ok) {
//         throw new Error('فشل رفع الملف');
//       }

//       const uploadData = uploadResp.data.data || uploadResp.data;
//       const fileUrl = (uploadData && (uploadData.fileUrl || uploadData.url)) || '';

//       if (!fileUrl) {
//         throw new Error('لم يتم الحصول على رابط الملف بعد الرفع');
//       }

//       // تحديث طلب الدفع
//       if (paymentId) {
//         const updateResp = await apiPost({
//           action: 'updatePaymentRequest',
//           paymentId: paymentId,
//           updates: {
//             'رابط إيصال الدفع': fileUrl,
//             receiptUrl: fileUrl,
//             الحالة: 'receipt_uploaded',
//             ملاحظات: 'تم رفع إيصال من صاحب المحل'
//           }
//         });

//         if (!updateResp.ok) {
//           throw new Error('تم رفع الإيصال لكن فشل ربطه بطلب الدفع');
//         }
//       }

//       messageDiv.textContent = 'تم إرسال الإيصال بنجاح. سيتم مراجعته والرد عليك قريباً.';
//       setTimeout(() => modal.remove(), 2000);

//     } catch (err) {
//       messageDiv.textContent = 'حدث خطأ أثناء الإرسال: ' + (err.message || err);
//       sendBtn.disabled = false;
//       sendBtn.textContent = 'أرسل الإيصال';
//     }
//   });
// }

// /* ========================= واجهة الباقات والحالة ========================= */
// async function refreshPackageUI() {
//   try {
//     const logged = getLoggedPlace();
    
//     // العناصر الرئيسية
//     const currentCard = document.getElementById('currentPackageCard');
//     const currentText = document.getElementById('currentPackageText');
//     const currentCountdown = document.getElementById('currentPackageCountdown');
//     const inlineCard = document.getElementById('packageInfoCard');
//     const inlineText = document.getElementById('packageInfoText');
//     const inlineCountdown = document.getElementById('packageInfoCountdown');

//     // إخفاء كل شيء مبدئياً
//     [currentCard, inlineCard].forEach(card => {
//       if (card) card.style.display = 'none';
//     });
    
//     [currentText, inlineText].forEach(text => {
//       if (text) text.textContent = '';
//     });
    
//     [currentCountdown, inlineCountdown].forEach(countdown => {
//       if (countdown) {
//         countdown.textContent = '';
//         countdown.className = 'package-countdown';
//         clearInterval(countdown._timer);
//       }
//     });

//     if (!logged || !logged.id) return;

//     // جلب بيانات اللوحة
//     const resp = await apiPost({ action: 'getDashboard', placeId: logged.id });
//     if (!resp.ok || !resp.data) return;
    
//     const dashboardData = resp.data.data || resp.data;
//     const place = dashboardData.place;
//     if (!place || !place.raw) return;

//     const packageStatus = String(place.raw['حالة الباقة'] || '').trim();
//     const packageId = String(place.raw['الباقة'] || '').trim();
//     const startDate = parseDateISO(place.raw['تاريخ بداية الاشتراك'] || '');
//     const endDate = parseDateISO(place.raw['تاريخ نهاية الاشتراك'] || '');

//     // العثور على اسم الباقة
//     let packageName = '';
//     try {
//       if (window.lastLookups && Array.isArray(lastLookups.packages)) {
//         const foundPackage = lastLookups.packages.find(p => String(p.id) === packageId);
//         if (foundPackage) packageName = foundPackage.name;
//       }
//     } catch {}

//     const today = new Date();
//     let remainingDays = (startDate && endDate) ? daysBetween(today, endDate) : null;
//     if (remainingDays !== null && remainingDays < 0) remainingDays = 0;

//     // دالة العدّاد التنازلي
//     function setupCountdown(element, endDate) {
//       if (!element || !endDate) return;
      
//       const updateCountdown = () => {
//         const timeDiff = diffDaysHours(new Date(), endDate);
//         const days = timeDiff.days ?? 0;
//         const hours = timeDiff.hours ?? 0;
//         element.textContent = `العدّاد: ${days} يوم و${hours} ساعة`;
//       };
      
//       updateCountdown();
//       clearInterval(element._timer);
//       element._timer = setInterval(updateCountdown, 60 * 1000);
//     }

//     // عرض البطاقات
//     const showPackageCards = () => {
//       [currentCard, inlineCard].forEach(card => {
//         if (card) card.style.display = 'block';
//       });
//     };

//     // معالجة حالات مختلفة
//     if (!packageStatus) {
//       showPackageCards();
//       if (currentText) currentText.textContent = 'باقتك الحالية: لا يوجد اشتراك';
//       if (inlineText) inlineText.textContent = 'باقتك الحالية: لا يوجد اشتراك';
//       return;
//     }

//     if (packageStatus === 'مفعلة') {
//       showPackageCards();
//       const displayName = packageName || (packageId ? `ID ${packageId}` : 'غير معروفة');
//       const endDateText = endDate ? endDate.toISOString().split('T') : '';
//       const remainingText = remainingDays !== null ? ` — المتبقي ${remainingDays} يوم` : '';
      
//       const fullText = `باقتك الحالية: ${displayName}${endDateText ? ` — تنتهي في ${endDateText}` : ''}${remainingText}`;
      
//       if (currentText) currentText.textContent = fullText;
//       if (inlineText) inlineText.textContent = fullText;
      
//       if (endDate) {
//         if (currentCountdown) setupCountdown(currentCountdown, endDate);
//         if (inlineCountdown) setupCountdown(inlineCountdown, endDate);
//       }
//       return;
//     }

//     if (packageStatus === 'قيد الدفع') {
//       showPackageCards();
//       const displayName = packageName || (packageId ? `ID ${packageId}` : 'غير معروفة');
//       const statusText = `باقتك الحالية: ${displayName} — الحالة: قيد الدفع`;
      
//       if (currentText) currentText.textContent = statusText;
//       if (inlineText) inlineText.textContent = statusText;
//       return;
//     }

//     if (packageStatus === 'منتهية') {
//       showPackageCards();
//       const displayName = packageName || (packageId ? `ID ${packageId}` : 'غير معروفة');
//       const endDateText = endDate ? endDate.toISOString().split('T') : '';
//       const statusText = `باقتك الحالية: ${displayName} — الحالة: منتهية${endDateText ? ` — انتهت في ${endDateText}` : ''}`;
      
//       if (currentText) currentText.textContent = statusText;
//       if (inlineText) inlineText.textContent = statusText;
//       return;
//     }

//     // حالات أخرى
//     showPackageCards();
//     const displayName = packageName || (packageId ? `ID ${packageId}` : 'غير معروفة');
//     const statusText = `باقتك الحالية: ${displayName} — الحالة: ${packageStatus}`;
    
//     if (currentText) currentText.textContent = statusText;
//     if (inlineText) inlineText.textContent = statusText;

//   } catch (e) {
//     console.warn('refreshPackageUI error', e);
//   }
// }

// /* ========================= شريط حالة المكان ========================= */
// function showPlaceStatusBar(place) {
//   const statusBar = document.getElementById('placeStatusBar');
//   const statusMessage = document.getElementById('placeStatusMessage');
  
//   if (!statusBar) return;
  
//   if (!place || !place.id) {
//     statusBar.style.display = 'none';
//     if (statusMessage) statusMessage.textContent = '';
//     return;
//   }
  
//   statusBar.style.display = 'block';
  
//   const currentStatus = (place.status && String(place.status).trim() !== '') 
//     ? place.status 
//     : (place.raw && (place.raw['حالة المكان'] || place.raw['حالة التسجيل'])) 
//       ? (place.raw['حالة المكان'] || place.raw['حالة التسجيل']) 
//       : '';
  
//   const buttons = document.querySelectorAll('#placeStatusButtons .status-btn');
//   buttons.forEach(button => {
//     button.classList.toggle('active', button.dataset.status === currentStatus);
//     button.disabled = false;
//     button.textContent = button.dataset.status;
//   });
  
//   if (statusMessage) {
//     statusMessage.textContent = currentStatus ? `الحالة الحالية: ${currentStatus}` : 'الحالة غير محددة';
//   }
  
//   initPlaceStatusButtons();
// }

// function hidePlaceStatusBar() {
//   const statusBar = document.getElementById('placeStatusBar');
//   const statusMessage = document.getElementById('placeStatusMessage');
  
//   if (statusBar) statusBar.style.display = 'none';
//   if (statusMessage) statusMessage.textContent = '';
// }

// function initPlaceStatusButtons() {
//   const container = document.getElementById('placeStatusButtons');
//   if (!container) return;
  
//   // إعادة إنشاء مستمعي الأحداث
//   container.querySelectorAll('.status-btn').forEach(button => {
//     const clone = button.cloneNode(true);
//     button.parentNode.replaceChild(clone, button);
//   });
  
//   const buttons = document.querySelectorAll('#placeStatusButtons .status-btn');
//   buttons.forEach(button => {
//     button.addEventListener('click', async () => {
//       const status = button.dataset.status;
//       if (!status) return;
//       await updatePlaceStatus(status, button);
//     });
//   });
// }

// async function updatePlaceStatus(newStatus, buttonElement = null) {
//   let originalText = null;
  
//   try {
//     const logged = getLoggedPlace();
//     const placeId = (logged && logged.id) ? logged.id : null;
    
//     if (!placeId) {
//       throw new Error('لا يوجد مكان مسجّل للدخول');
//     }

//     const currentStatus = (logged && logged.status) 
//       ? logged.status 
//       : (logged && logged.raw && (logged.raw['حالة المكان'] || logged.raw['حالة التسجيل'])) 
//         ? (logged.raw['حالة المكان'] || logged.raw['حالة التسجيل']) 
//         : '';

//     // إذا كانت الحالة نفسها، لا حاجة للتحديث
//     if (String(currentStatus) === String(newStatus)) {
//       document.querySelectorAll('#placeStatusButtons .status-btn').forEach(button => {
//         button.classList.toggle('active', button.dataset.status === newStatus);
//       });
      
//       const statusMessage = document.getElementById('placeStatusMessage');
//       if (statusMessage) statusMessage.textContent = `الحالة: ${newStatus}`;
//       return;
//     }

//     // تعطيل كل الأزرار أثناء التحديث
//     const buttons = document.querySelectorAll('#placeStatusButtons .status-btn');
//     buttons.forEach(button => button.disabled = true);

//     if (buttonElement) {
//       originalText = buttonElement.textContent;
//       buttonElement.textContent = 'جاري الحفظ...';
//     }

//     // إرسال التحديث للخادم
//     const resp = await apiPost({
//       action: 'updatePlace',
//       placeId: placeId,
//       status: newStatus
//     });

//     if (!resp.ok) {
//       throw new Error('فشل في التواصل مع الخادم');
//     }

//     const data = resp.data;
//     if (!data || data.success === false) {
//       throw new Error((data && data.error) ? data.error : 'استجابة غير متوقعة');
//     }

//     // تحديث البيانات المحلية
//     const stored = getLoggedPlace() || {};
//     stored.status = newStatus;
//     if (!stored.raw) stored.raw = {};
//     stored.raw['حالة المكان'] = newStatus;
//     stored.raw['حالة التسجيل'] = newStatus;
//     setLoggedPlace(stored);

//     // تحديث واجهة الأزرار
//     buttons.forEach(button => {
//       button.classList.toggle('active', button.dataset.status === newStatus);
//       button.disabled = false;
//       button.textContent = button.dataset.status;
//     });

//     if (buttonElement && originalText !== null) {
//       buttonElement.textContent = buttonElement.dataset.status;
//     }

//     const statusMessage = document.getElementById('placeStatusMessage');
//     if (statusMessage) {
//       statusMessage.textContent = `تم التحديث إلى: ${newStatus}`;
//     }

//     showSuccess('تم تحديث حالة المكان بنجاح');

//   } catch (err) {
//     console.error('updatePlaceStatus error', err);
//     showError(err.message || 'فشل تحديث حالة المكان');
    
//     // استعادة الأزرار
//     document.querySelectorAll('#placeStatusButtons .status-btn').forEach(button => {
//       button.disabled = false;
//       button.textContent = button.dataset.status;
//     });
    
//     if (buttonElement && originalText !== null) {
//       buttonElement.textContent = originalText;
//     }
//   }
// }

// /* ========================= مساعدات متنوعة ========================= */
// function showTab(tabName) {
//   // إخفاء كل المحتويات
//   document.querySelectorAll('.tab-content').forEach(content => {
//     content.style.display = 'none';
//   });
  
//   // إزالة الفئة المفعلة من كل التبويبات
//   document.querySelectorAll('.tab').forEach(tab => {
//     tab.classList.remove('active');
//   });
  
//   // عرض المحتوى المطلوب
//   const targetContent = document.getElementById(tabName + '-tab');
//   if (targetContent) {
//     targetContent.style.display = 'block';
//   }
  
//   // تفعيل التبويب
//   const targetTab = document.getElementById('tab-' + tabName);
//   if (targetTab) {
//     targetTab.classList.add('active');
//   }
  
//   currentTab = tabName;
// }

// function clearImagePreview() {
//   const preview = document.getElementById('placeImagePreview');
//   if (preview) preview.innerHTML = '';
//   uploadedImages = [];
// }

// function clearAdForm(form) {
//   form.reset();
  
//   const imagePreview = document.getElementById('adImagesPreview');
//   const videoPreview = document.getElementById('adVideoPreview');
  
//   if (imagePreview) imagePreview.innerHTML = '';
//   if (videoPreview) videoPreview.innerHTML = '';
  
//   uploadedImages = [];
//   uploadedVideos = [];
// }

// function startEditAd(ad) {
//   try {
//     editingAdId = ad.id || null;
//     const form = document.getElementById('adForm');
//     if (!form) return;

//     // ملء البيانات الأساسية
//     const fieldMap = {
//       'select[name="placeId"]': ad.placeId || '',
//       'select[name="adType"]': ad.type || '',
//       'input[name="adTitle"]': ad.title || '',
//       'input[name="coupon"]': ad.coupon || '',
//       'textarea[name="adDescription"]': ad.description || '',
//       'input[name="startDate"]': ad.startDate || '',
//       'input[name="endDate"]': ad.endDate || '',
//       'select[name="adActiveStatus"]': ad.adActiveStatus || ad.status || '',
//       'select[name="adStatus"]': ad.adStatus || ad.status || ''
//     };

//     for (const [selector, value] of Object.entries(fieldMap)) {
//       const element = form.querySelector(selector);
//       if (element) element.value = value;
//     }

//     // معاينة الصور
//     const imagePreview = document.getElementById('adImagesPreview');
//     if (imagePreview) {
//       imagePreview.innerHTML = '';
      
//       if (ad.images && ad.images.length) {
//         const imagesArray = Array.isArray(ad.images) ? ad.images : 
//           (typeof ad.images === 'string' ? JSON.parse(ad.images) : []);
        
//         imagesArray.forEach(image => {
//           const url = image && image.url ? image.url : (typeof image === 'string' ? image : '');
//           const name = image && image.name ? image.name : (typeof image === 'string' ? image : '');
          
//           const container = document.createElement('div');
//           container.className = 'preview-image';
          
//           if (url) {
//             const img = document.createElement('img');
//             img.src = url;
//             img.style.cssText = 'width:100%;height:90px;object-fit:cover';
//             container.appendChild(img);
//           } else if (name && recentUploads[name]) {
//             const img = document.createElement('img');
//             img.src = recentUploads[name].url;
//             img.style.cssText = 'width:100%;height:90px;object-fit:cover';
//             container.appendChild(img);
//           } else if (name) {
//             const placeholder = document.createElement('div');
//             placeholder.className = 'img-placeholder-file';
//             placeholder.textContent = name;
//             container.appendChild(placeholder);
//           }
          
//           imagePreview.appendChild(container);
//         });
//       }
//     }

//     // معاينة الفيديو
//     const videoPreview = document.getElementById('adVideoPreview');
//     if (videoPreview) {
//       videoPreview.innerHTML = '';
      
//       if (ad.videoUrl) {
//         const video = document.createElement('video');
//         video.src = ad.videoUrl;
//         video.controls = true;
//         video.style.width = '100%';
//         videoPreview.appendChild(video);
//       }
//     }

//     // تغيير نص الزر
//     const submitBtn = document.querySelector('#adForm button[type="submit"]');
//     if (submitBtn) submitBtn.textContent = 'تحديث الإعلان';
    
//     // الانتقال لتبويب الإعلانات
//     showTab('ads');
    
//   } catch (e) {
//     console.error('startEditAd failed', e);
//   }
// }

// async function tryPrefillPlaceForm(place) {
//   if (!place || !place.raw) return;
  
//   try {
//     const raw = place.raw;
    
//     // دالة مساعدة لملء الحقول
//     const setInput = (selector, value) => {
//       const element = document.querySelector(selector);
//       if (element && value !== undefined && value !== null) {
//         element.value = value;
//       }
//     };

//     // ملء البيانات الأساسية
//     const name = raw['اسم المكان'] || place.name || '';
//     setInput('input[name="placeName"]', name);
//     setInput('input[name="password"]', raw['كلمة المرور'] || place.password || '');
//     setInput('input[name="detailedAddress"]', raw['العنوان التفصيلي'] || '');
//     setInput('input[name="mapLink"]', raw['رابط الموقع على الخريطة'] || '');
//     setInput('input[name="phone"]', raw['رقم التواصل'] || '');
//     setInput('input[name="whatsappLink"]', raw['رابط واتساب'] || '');
//     setInput('input[name="email"]', raw['البريد الإلكتروني'] || '');
//     setInput('input[name="website"]', raw['الموقع الالكتروني'] || '');
//     setInput('input[name="workingHours"]', raw['ساعات العمل'] || '');
//     setInput('textarea[name="description"]', raw['وصف مختصر '] || '');

//     // ملء القوائم المنسدلة
//     await setSelectValueWhenReady('select[name="activityType"]', raw['نوع النشاط / الفئة'] || '');
//     await setSelectValueWhenReady('select[name="city"]', raw['المدينة'] || '');
    
//     if ((raw['المدينة'] || '') !== '') {
//       updateAreas();
//     }
    
//     await setSelectValueWhenReady('select[name="area"]', raw['المنطقة'] || '');
//     await setSelectValueWhenReady('select[name="location"]', raw['الموقع او المول'] || '');

//     // عرض الشعار
//     const logoUrl = raw['رابط صورة شعار المكان'] || raw['صورة شعار أو صورة المكان'] || '';
//     if (logoUrl) {
//       const preview = document.getElementById('placeImagePreview');
//       if (preview) {
//         preview.innerHTML = '';
//         const img = document.createElement('img');
//         img.src = logoUrl;
//         preview.appendChild(img);
//       }
//     }

//     // تحديث معلومات الباقة المضمنة
//     updateInlinePackageInfo(place);
    
//   } catch (e) {
//     console.warn('tryPrefillPlaceForm error', e);
//   }
// }

// function updateInlinePackageInfo(place) {
//   try {
//     const card = document.getElementById('packageInfoCard');
//     const text = document.getElementById('packageInfoText');
//     const countdown = document.getElementById('packageInfoCountdown');
    
//     if (!card || !text || !countdown) return;
    
//     // إخفاء مبدئياً
//     card.style.display = 'none';
//     text.textContent = '';
//     countdown.textContent = '';
//     clearInterval(countdown._timer);

//     const raw = place.raw || {};
//     const packageStatus = String(raw['حالة الباقة'] || '').trim();
//     const packageId = String(raw['الباقة'] || '').trim();
//     const startDate = parseDateISO(raw['تاريخ بداية الاشتراك'] || '');
//     const endDate = parseDateISO(raw['تاريخ نهاية الاشتراك'] || '');

//     // العثور على اسم الباقة
//     let packageName = '';
//     try {
//       if (window.lastLookups && Array.isArray(lastLookups.packages)) {
//         const foundPackage = lastLookups.packages.find(p => String(p.id) === packageId);
//         if (foundPackage) packageName = foundPackage.name;
//       }
//     } catch {}

//     if (!packageStatus) {
//       card.style.display = 'block';
//       text.textContent = 'باقتك الحالية: لا يوجد اشتراك';
//       return;
//     }

//     if (packageStatus === 'مفعلة') {
//       const today = new Date();
//       let remainingDays = (startDate && endDate) ? daysBetween(today, endDate) : null;
//       if (remainingDays !== null && remainingDays < 0) remainingDays = 0;
      
//       const displayName = packageName || (packageId ? `ID ${packageId}` : 'غير معروفة');
//       const endDateText = endDate ? endDate.toISOString().split('T') : '';
//       const remainingText = remainingDays !== null ? ` — المتبقي ${remainingDays} يوم` : '';
      
//       text.textContent = `باقتك الحالية: ${displayName}${endDateText ? ` — تنتهي في ${endDateText}` : ''}${remainingText}`;
//       card.style.display = 'block';
      
//       if (endDate) {
//         const updateCountdown = () => {
//           const timeDiff = diffDaysHours(new Date(), endDate);
//           const days = timeDiff.days ?? 0;
//           const hours = timeDiff.hours ?? 0;
//           countdown.textContent = `العدّاد: ${days} يوم و${hours} ساعة`;
//         };
        
//         updateCountdown();
//         clearInterval(countdown._timer);
//         countdown._timer = setInterval(updateCountdown, 60 * 1000);
//       }
//       return;
//     }

//     // حالات أخرى
//     const displayName = packageName || (packageId ? `ID ${packageId}` : 'غير معروفة');
//     let statusText = '';
    
//     if (packageStatus === 'قيد الدفع') {
//       statusText = `باقتك الحالية: ${displayName} — الحالة: قيد الدفع`;
//     } else if (packageStatus === 'منتهية') {
//       const endDateText = endDate ? endDate.toISOString().split('T') : '';
//       statusText = `باقتك الحالية: ${displayName} — الحالة: منتهية${endDateText ? ` — انتهت في ${endDateText}` : ''}`;
//     } else {
//       statusText = `باقتك الحالية: ${displayName} — الحالة: ${packageStatus}`;
//     }
    
//     text.textContent = statusText;
//     card.style.display = 'block';
    
//   } catch (e) {
//     console.warn('updateInlinePackageInfo error', e);
//   }
// }

// function setSelectByValueOrText(selectElement, value) {
//   if (!selectElement) return false;
  
//   const searchValue = (value === null || value === undefined) ? '' : String(value).trim();
//   if (!searchValue) return false;

//   // البحث بالقيمة
//   for (let i = 0; i < selectElement.options.length; i++) {
//     const option = selectElement.options[i];
//     if (String(option.value) === searchValue) {
//       selectElement.value = option.value;
//       return true;
//     }
//   }

//   // البحث بالنص
//   for (let i = 0; i < selectElement.options.length; i++) {
//     const option = selectElement.options[i];
//     if (String(option.text).trim() === searchValue) {
//       selectElement.value = option.value;
//       return true;
//     }
//   }

//   // البحث الجزئي
//   for (let i = 0; i < selectElement.options.length; i++) {
//     const option = selectElement.options[i];
//     if (String(option.text).toLowerCase().includes(searchValue.toLowerCase())) {
//       selectElement.value = option.value;
//       return true;
//     }
//   }

//   return false;
// }

// function setSelectValueWhenReady(selector, value, retries = 12, interval = 200) {
//   return new Promise(resolve => {
//     if (!selector || value === null || value === undefined || String(value).trim() === '') {
//       resolve(false);
//       return;
//     }

//     let attempts = 0;
    
//     const trySet = () => {
//       attempts++;
//       const element = (typeof selector === 'string') ? document.querySelector(selector) : selector;
      
//       if (element) {
//         const success = setSelectByValueOrText(element, value);
//         if (success) {
//           resolve(true);
//           return;
//         }
//       }

//       if (attempts >= retries) {
//         resolve(false);
//         return;
//       }

//       setTimeout(trySet, interval);
//     };

//     trySet();
//   });
// }

// // دوال التواريخ والوقت
// function parseDateISO(dateString) {
//   if (!dateString) return null;
  
//   try {
//     if (dateString instanceof Date) return dateString;
    
//     const str = String(dateString).trim();
//     if (!str) return null;
    
//     const parts = str.split('-');
//     if (parts.length === 3) {
//       const year = Number(parts);
//       const month = Number(parts[1]) - 1;
//       const day = Number(parts[2]);
//       const date = new Date(year, month, day);
//       date.setHours(23, 59, 59, 999);
//       return date;
//     }
    
//     const date = new Date(str);
//     return isNaN(date.getTime()) ? null : date;
//   } catch {
//     return null;
//   }
// }

// function daysBetween(fromDate, toDate) {
//   if (!fromDate || !toDate) return null;
  
//   const from = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
//   const to = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate());
//   const diffMs = to - from;
  
//   return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
// }

// function diffDaysHours(fromDate, toDate) {
//   if (!fromDate || !toDate) return { days: null, hours: null, ms: null };
  
//   let diff = toDate.getTime() - fromDate.getTime();
//   if (diff < 0) diff = 0;
  
//   const dayMs = 1000 * 60 * 60 * 24;
//   const hourMs = 1000 * 60 * 60;
  
//   const days = Math.floor(diff / dayMs);
//   const remainingMs = diff - (days * dayMs);
//   const hours = Math.floor(remainingMs / hourMs);
  
//   return { days, hours, ms: toDate.getTime() - fromDate.getTime() };
// }

// // دوال الواجهة
// function showSuccess(message) {
//   const element = document.getElementById('successAlert');
//   if (!element) return;
  
//   element.textContent = message;
//   element.className = 'alert alert-success';
//   element.style.display = 'block';
  
//   setTimeout(() => {
//     element.style.display = 'none';
//   }, 4000);
// }

// function showError(message) {
//   const element = document.getElementById('errorAlert');
//   if (!element) return;
  
//   element.textContent = message;
//   element.className = 'alert alert-error';
//   element.style.display = 'block';
  
//   setTimeout(() => {
//     element.style.display = 'none';
//   }, 5000);
// }

// function showLoading(show) {
//   const element = document.getElementById('loading');
//   if (!element) return;
  
//   element.style.display = show ? 'block' : 'none';
// }

// function escapeHtml(text) {
//   if (text === null || text === undefined) return '';
  
//   return String(text).replace(/[&<>"']/g, function(match) {
//     return {
//       '&': '&amp;',
//       '<': '&lt;',
//       '>': '&gt;',
//       '"': '&quot;',
//       "'": '&#39;'
//     }[match];
//   });
// }


















































// const API_URL = 'https://script.google.com/macros/s/AKfycbwB0VE5COC0e6NQNKrxQeNRu2Mtt_QuMbVoBrH7tE6Da3X3BP6UxK926bt9fDO0WPU5/exec';

// // المتغيرات العامة
// let currentTab = 'places';
// let uploadedImages = [];
// let uploadedVideos = [];
// let editingAdId = null;
// const recentUploads = {};
// const THEME_KEY = 'khedmatak_theme';

// /* ========================= المظهر والثيم ========================= */
// function applyTheme(theme) {
//   if (theme === 'dark') {
//     document.body.classList.add('dark');
//     const icon = document.getElementById('themeIcon');
//     const lbl = document.getElementById('themeLabel'); 
//     if (icon) icon.className = 'fas fa-sun';
//     if (lbl) lbl.textContent = 'الوضع النهاري';
//   } else {
//     document.body.classList.remove('dark');
//     const icon = document.getElementById('themeIcon');
//     const lbl = document.getElementById('themeLabel');
//     if (icon) icon.className = 'fas fa-moon';
//     if (lbl) lbl.textContent = 'الوضع الليلي';
//   }
//   try { localStorage.setItem(THEME_KEY, theme || 'light'); } catch (e) {}
// }

// function toggleTheme() {
//   const current = localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light';
//   applyTheme(current === 'dark' ? 'light' : 'dark');
// }

// function initTheme() {
//   try {
//     const saved = localStorage.getItem(THEME_KEY);
//     if (saved) {
//       applyTheme(saved);
//     } else {
//       const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
//       applyTheme(prefersDark ? 'dark' : 'light');
//     }
//   } catch (e) { 
//     applyTheme('light'); 
//   }
// }

// /* ========================= API والتواصل ========================= */
// async function apiPost(payload) {
//   try {
//     let body;
//     let headers = {};
    
//     if (payload instanceof FormData) {
//       body = payload;
//     } else if (typeof payload === 'object' && payload !== null) {
//       const form = new FormData();
//       for (const k of Object.keys(payload)) {
//         const v = payload[k];
//         if (v !== null && typeof v === 'object') {
//           form.append(k, JSON.stringify(v));
//         } else {
//           form.append(k, v === undefined ? '' : String(v));
//         }
//       }
//       body = form;
//     } else {
//       headers['Content-Type'] = 'text/plain';
//       body = String(payload);
//     }

//     const response = await fetch(API_URL, { 
//       method: 'POST', 
//       body: body,
//       headers: headers
//     });
    
//     if (!response.ok) {
//       throw new Error(`HTTP Error: ${response.status}`);
//     }
    
//     const text = await response.text();
//     let data = null;
    
//     try {
//       data = JSON.parse(text);
//     } catch (parseError) {
//       console.warn('Response is not valid JSON:', text);
//       data = { success: false, error: 'استجابة غير صالحة من الخادم' };
//     }
    
//     return { 
//       ok: true, 
//       status: response.status, 
//       data: data, 
//       raw: text 
//     };
    
//   } catch (err) {
//     console.error('API Post Error:', err);
//     return { 
//       ok: false, 
//       status: 0, 
//       error: err.message || String(err),
//       data: { success: false, error: err.message || String(err) }
//     };
//   }
// }

// async function apiFetch(url, opts = {}) {
//   try {
//     const response = await fetch(url, opts);
//     const text = await response.text();
    
//     let data = null;
//     try { 
//       data = JSON.parse(text); 
//     } catch { 
//       data = text; 
//     }
    
//     return { 
//       ok: response.ok, 
//       status: response.status, 
//       data: data, 
//       raw: text 
//     };
//   } catch (err) {
//     return { 
//       ok: false, 
//       status: 0, 
//       error: err.message || String(err) 
//     };
//   }
// }

// /* ========================= التهيئة الرئيسية ========================= */
// document.addEventListener('DOMContentLoaded', () => {
//   initializeApp();
//   initTheme();
//   setupEventListeners();
//   loadLookupsAndPopulate();
//   setupAuthUI();
//   initMapFeatures();
  
//   const stored = getLoggedPlace();
//   if (stored && stored.id) {
//     showPlaceStatusBar(stored);
//     refreshSubscriptionBar();
//   } else {
//     hidePlaceStatusBar();
//     hideSubscriptionBar();
//   }
  
//   updateAdsTabVisibility();
// });

// function initializeApp() {
//   const today = new Date().toISOString().split('T');
//   const nextWeek = new Date();
//   nextWeek.setDate(nextWeek.getDate() + 7);
  
//   const startInput = document.querySelector('input[name="startDate"]');
//   const endInput = document.querySelector('input[name="endDate"]');
  
//   if (startInput) startInput.value = today;
//   if (endInput) endInput.value = nextWeek.toISOString().split('T');
// }

// function setupEventListeners() {
//   const placeForm = document.getElementById('placeForm');
//   const adForm = document.getElementById('adForm');
//   const citySelect = document.querySelector('select[name="city"]');
//   const themeBtn = document.getElementById('themeToggleBtn');
//   const goPackagesBtn = document.getElementById('goPackagesBtn');

//   if (placeForm) placeForm.addEventListener('submit', handlePlaceSubmit);
//   if (adForm) adForm.addEventListener('submit', handleAdSubmit);
//   if (citySelect) citySelect.addEventListener('change', updateAreas);
//   if (themeBtn) themeBtn.addEventListener('click', toggleTheme);
  
//   if (goPackagesBtn) {
//     goPackagesBtn.addEventListener('click', () => {
//       const logged = getLoggedPlace();
//       if (!logged || !logged.id) {
//         showError('احفظ بيانات المكان أولاً للانتقال إلى الباقات');
//         return;
//       }
//       showTab('packages');
//     });
//   }
// }

// /* ========================= البيانات والقوائم ========================= */
// async function loadLookupsAndPopulate() {
//   try {
//     const resp = await apiFetch(`${API_URL}?action=getLookups`);
//     if (!resp.ok) {
//       console.warn('getLookups failed', resp);
//       return;
//     }
    
//     const json = resp.data;
//     const data = (json && json.success && json.data) ? json.data : json;
//     if (!data) return;

//     window.lastLookups = data;

//     // تعبئة قوائم الأنشطة
//     populateSelect('select[name="activityType"]', data.activities, 'اختر نوع النشاط');
    
//     // تعبئة قوائم المدن
//     populateSelect('select[name="city"]', data.cities, 'اختر المدينة');
    
//     // إعداد خريطة المناطق
//     setupCityAreaMap(data.areas);
    
//     // تعبئة قوائم المواقع
//     populateSelect('select[name="location"]', data.sites, 'اختر الموقع');
    
//     // إعداد شبكة الباقات
//     setupPackagesGrid(data.packages);
    
//     // حفظ طرق الدفع
//     window.availablePaymentMethods = (data.paymentsMethods || []).map(pm => ({
//       id: pm.id || (pm.raw && pm.raw['معرف الدفع']),
//       name: pm.name || (pm.raw && (pm.raw['طرق الدفع'] || pm.raw['طريقة الدفع'])),
//       raw: pm.raw || pm
//     }));

//     // تحميل بيانات المكان المحفوظة
//     const stored = getLoggedPlace();
//     if (stored && stored.raw) {
//       await tryPrefillPlaceForm(stored);
//       if (stored.id) {
//         checkAdQuotaAndToggle(stored.id);
//         loadAdsForPlace(stored.id);
//       }
//     }

//     updateAdsTabVisibility();
//     await refreshSubscriptionBar();
//     await loadPlacesForAds();
    
//   } catch (err) {
//     console.error('loadLookupsAndPopulate error', err);
//   }
// }

// function populateSelect(selector, items, defaultText) {
//   const select = document.querySelector(selector);
//   if (!select) return;
  
//   select.innerHTML = `<option value="">${defaultText}</option>`;
  
//   (items || []).forEach(item => {
//     const opt = document.createElement('option');
//     opt.value = item.id;
//     opt.textContent = item.name;
//     select.appendChild(opt);
//   });
// }

// function setupCityAreaMap(areas) {
//   const cityAreaMap = {};
//   (areas || []).forEach(area => {
//     const cityId = area.raw && (area.raw['ID المدينة'] || area.raw['cityId']) 
//       ? String(area.raw['ID المدينة'] || area.raw['cityId']) 
//       : '';
//     if (!cityAreaMap[cityId]) cityAreaMap[cityId] = [];
//     cityAreaMap[cityId].push({ id: area.id, name: area.name });
//   });
//   window.cityAreaMap = cityAreaMap;
// }

// function updateAreas() {
//   const citySelect = document.querySelector('select[name="city"]');
//   const areaSelect = document.querySelector('select[name="area"]');
  
//   if (!citySelect || !areaSelect) return;
  
//   areaSelect.innerHTML = '<option value="">اختر المنطقة</option>';
  
//   const selectedCity = citySelect.value;
//   if (selectedCity && window.cityAreaMap && window.cityAreaMap[selectedCity]) {
//     window.cityAreaMap[selectedCity].forEach(area => {
//       const opt = document.createElement('option');
//       opt.value = area.id;
//       opt.textContent = area.name;
//       areaSelect.appendChild(opt);
//     });
//   }
// }

// /* ========================= شبكة الباقات ========================= */
// function setupPackagesGrid(packages) {
//   const grid = document.getElementById('packagesGrid');
//   if (!grid) return;
  
//   grid.innerHTML = '';
//   const logged = getLoggedPlace();
//   const currentPkgId = logged && logged.raw ? String(logged.raw['الباقة'] || '') : '';
//   const currentPkgStatus = logged && logged.raw ? String(logged.raw['حالة الباقة'] || '').trim() : '';

//   (packages || []).forEach(pkg => {
//     const card = document.createElement('div');
//     card.className = 'pkg-card';
    
//     const duration = Number(pkg.duration || (pkg.raw && (pkg.raw['مدة الباقة باليوم'] || pkg.raw['مدة'])) || 0) || 0;
//     const price = Number(pkg.price || (pkg.raw && (pkg.raw['سعر الباقة'] || pkg.raw['السعر'])) || 0) || 0;
//     const allowedAds = Number(pkg.allowedAds || (pkg.raw && (pkg.raw['عدد الاعلانات'] || pkg.raw['عدد_الاعلانات'])) || 0) || 0;
    
//     const isCurrent = currentPkgId && String(pkg.id) === String(currentPkgId);
    
//     // تمييز البطاقة الحالية
//     if (isCurrent) {
//       card.style.border = '2px solid #10b981';
//       card.style.boxShadow = '0 6px 18px rgba(16,185,129,0.15)';
      
//       const badge = document.createElement('div');
//       badge.textContent = 'باقتك الحالية';
//       badge.style.cssText = `
//         display: inline-block;
//         background: #10b981;
//         color: #fff;
//         padding: 4px 8px;
//         border-radius: 999px;
//         margin-bottom: 8px;
//         font-size: 12px;
//         font-weight: 700;
//       `;
//       card.appendChild(badge);
//     }
    
//     // العنوان والتفاصيل
//     const title = document.createElement('h3');
//     title.textContent = pkg.name;
//     card.appendChild(title);
    
//     const details = document.createElement('p');
//     details.textContent = `المدة: ${duration} يوم • السعر: ${price} • الإعلانات: ${allowedAds}`;
//     card.appendChild(details);
    
//     if (pkg.raw && (pkg.raw['وصف الباقة'] || pkg.raw['description'])) {
//       const desc = document.createElement('p');
//       desc.textContent = pkg.raw['وصف الباقة'] || pkg.raw['description'];
//       card.appendChild(desc);
//     }
    
//     // زر الاختيار
//     const btn = document.createElement('button');
//     btn.className = 'choose-pkg';
    
//     // تحديد نص الزر - توحيد استخدام "نشطة"
//     if (isCurrent && (currentPkgStatus === 'نشطة' || currentPkgStatus === 'مفعلة')) {
//       btn.textContent = 'هذه باقتك';
//       btn.disabled = true;
//     } else if (isCurrent && currentPkgStatus === 'قيد الدفع') {
//       btn.textContent = 'قيد الدفع';
//       btn.disabled = true;
//     } else if (isCurrent && currentPkgStatus === 'منتهية') {
//       btn.textContent = 'إعادة التفعيل';
//     } else {
//       btn.textContent = price === 0 ? 'تفعيل فوري' : 'اختر الباقة';
//     }
    
//     btn.onclick = async () => {
//       const logged = getLoggedPlace();
//       if (!logged || !logged.id) {
//         showError('احفظ بيانات المكان أولاً');
//         return;
//       }
      
//       if (price === 0) {
//         const isBlocked = await checkIfTrialIsUsed(logged.id);
//         if (isBlocked) {
//           showError('الباقة التجريبية غير متاحة مرة أخرى بعد انتهاء اشتراك سابق');
//           return;
//         }
//       }
      
//       await choosePackage(pkg.id, price);
//     };
    
//     card.appendChild(btn);
//     grid.appendChild(card);
//   });
// }

// /* ========================= اختيار الباقات ========================= */
// async function choosePackage(packageId, price = 0) {
//   const logged = getLoggedPlace();
//   if (!logged || !logged.id) {
//     showError('يجب تسجيل الدخول أولاً');
//     return;
//   }
  
//   try {
//     const resp = await apiPost({ 
//       action: 'choosePackage', 
//       placeId: logged.id, 
//       packageId, 
//       free: price === 0 
//     });
    
//     if (!resp.ok) {
//       showError('فشل تغيير الباقة');
//       return;
//     }
    
//     const data = resp.data;
//     if (!data || data.success === false) {
//       showError(data.error || 'فشل تغيير الباقة');
//       return;
//     }

//     const result = data.data || data;
    
//     if (result.pending) {
//       // باقة مدفوعة - إظهار نافذة الدفع
//       showPaymentModal({
//         paymentId: result.paymentId,
//         amount: result.amount,
//         currency: result.currency || 'SAR',
//         placeId: logged.id
//       });
      
//       // تحديث حالة الباقة محلياً
//       updateLocalPackageStatus(packageId, 'قيد الدفع');
//       showSuccess('تم إنشاء طلب دفع. اتبع الإرشادات لإرسال إيصال الدفع');
//     } else {
//       // باقة مجانية أو تفعيل مباشر
//       updateLocalPackageStatus(packageId, 'نشطة', result);
//       showSuccess(result.message || 'تم تفعيل الباقة بنجاح');
//     }
    
//   } catch (err) {
//     console.error('choosePackage error', err);
//     showError(err.message || 'فشل تغيير الباقة');
//   } finally {
//     await refreshSubscriptionBar();
//     await loadLookupsAndPopulate();
//   }
// }

// function updateLocalPackageStatus(packageId, status, data = null) {
//   const place = getLoggedPlace() || {};
//   place.raw = place.raw || {};
  
//   place.raw['الباقة'] = packageId;
//   place.raw['حالة الباقة'] = status;
  
//   if (data) {
//     if (data.start) place.raw['تاريخ بداية الاشتراك'] = data.start;
//     if (data.end) place.raw['تاريخ نهاية الاشتراك'] = data.end;
//     if (data.trialActivated) place.raw['حالة الباقة التجريبية'] = 'true';
//   }
  
//   setLoggedPlace(place);
//   refreshSubscriptionBar();
// }

// async function checkIfTrialIsUsed(placeId) {
//   try {
//     const resp = await apiPost({ action: 'getDashboard', placeId });
//     if (!resp.ok) return false;
    
//     const data = resp.data.data || resp.data;
//     const place = data.place;
//     if (!place || !place.raw) return false;
    
//     const trialUsed = String(place.raw['حالة الباقة التجريبية']).toLowerCase() === 'true';
//     const pkgStatus = String(place.raw['حالة الباقة'] || '').trim();
    
//     return trialUsed && pkgStatus === 'منتهية';
//   } catch (e) {
//     console.warn('checkIfTrialIsUsed error', e);
//     return false;
//   }
// }

// /* ========================= الشريط الثابت للاشتراك ========================= */
// async function refreshSubscriptionBar() {
//   try {
//     const logged = getLoggedPlace();
//     const subscriptionBar = document.getElementById('subscriptionStatusBar');
//     const subscriptionTitle = document.getElementById('subscriptionTitle');
//     const subscriptionDetails = document.getElementById('subscriptionDetails');
//     const subscriptionCountdown = document.getElementById('subscriptionCountdown');

//     if (!logged || !logged.id) {
//       hideSubscriptionBar();
//       return;
//     }

//     if (subscriptionBar) subscriptionBar.style.display = 'none';
//     if (subscriptionTitle) subscriptionTitle.textContent = '';
//     if (subscriptionDetails) subscriptionDetails.textContent = '';
//     if (subscriptionCountdown) { 
//       subscriptionCountdown.textContent = '';
//       clearInterval(subscriptionCountdown._timer);
//     }

//     // جلب بيانات اللوحة
//     const resp = await apiPost({ action: 'getDashboard', placeId: logged.id });
//     if (!resp.ok || !resp.data) {
//       displaySubscriptionFromLocal();
//       return;
//     }
    
//     const dashboardData = resp.data.data || resp.data;
//     const place = dashboardData.place;
//     if (!place || !place.raw) {
//       displaySubscriptionFromLocal();
//       return;
//     }

//     // تحديث البيانات المحلية
//     const updatedPlace = getLoggedPlace() || {};
//     updatedPlace.raw = { ...updatedPlace.raw, ...place.raw };
//     setLoggedPlace(updatedPlace);

//     // عرض بيانات الاشتراك
//     displaySubscriptionInfo(place.raw);

//   } catch (e) {
//     console.warn('refreshSubscriptionBar error', e);
//     displaySubscriptionFromLocal();
//   }
// }

// function displaySubscriptionFromLocal() {
//   const logged = getLoggedPlace();
//   if (logged && logged.raw) {
//     displaySubscriptionInfo(logged.raw);
//   } else {
//     hideSubscriptionBar();
//   }
// }

// function displaySubscriptionInfo(raw) {
//   const subscriptionBar = document.getElementById('subscriptionStatusBar');
//   const subscriptionTitle = document.getElementById('subscriptionTitle');
//   const subscriptionDetails = document.getElementById('subscriptionDetails');
//   const subscriptionCountdown = document.getElementById('subscriptionCountdown');

//   const packageStatus = String(raw['حالة الباقة'] || '').trim();
//   const packageId = String(raw['الباقة'] || '').trim();
//   const startDate = parseDateISO(raw['تاريخ بداية الاشتراك'] || '');
//   const endDate = parseDateISO(raw['تاريخ نهاية الاشتراك'] || '');

//   // العثور على اسم الباقة
//   let packageName = '';
//   try {
//     if (window.lastLookups && Array.isArray(window.lastLookups.packages)) {
//       const foundPackage = window.lastLookups.packages.find(p => String(p.id) === packageId);
//       if (foundPackage) packageName = foundPackage.name;
//     }
//   } catch {}

//   const today = new Date();
//   let remainingDays = (startDate && endDate) ? daysBetween(today, endDate) : null;
//   if (remainingDays !== null && remainingDays < 0) remainingDays = 0;

//   // دالة العدّاد التنازلي
//   function setupCountdown(element, endDate) {
//     if (!element || !endDate) return;
    
//     const updateCountdown = () => {
//       const timeDiff = diffDaysHours(new Date(), endDate);
//       const days = timeDiff.days ?? 0;
//       const hours = timeDiff.hours ?? 0;
//       element.textContent = `${days} يوم و ${hours} ساعة`;
//     };
    
//     updateCountdown();
//     clearInterval(element._timer);
//     element._timer = setInterval(updateCountdown, 60 * 1000);
//   }

//   // عرض الشريط
//   if (subscriptionBar) subscriptionBar.style.display = 'block';

//   // معالجة حالات مختلفة
//   if (!packageStatus || packageStatus === 'لا يوجد اشتراك') {
//     if (subscriptionTitle) subscriptionTitle.textContent = 'لا يوجد اشتراك نشط';
//     if (subscriptionDetails) subscriptionDetails.textContent = 'اختر باقة من قسم الباقات لبدء الاشتراك';
//     if (subscriptionCountdown) subscriptionCountdown.textContent = '';
//     return;
//   }

//   if (packageStatus === 'نشطة' || packageStatus === 'مفعلة') {
//     const displayName = packageName || (packageId ? `ID ${packageId}` : 'غير معروفة');
//     const endDateText = endDate ? endDate.toISOString().split('T') : '';
//     const remainingText = remainingDays !== null ? `المتبقي ${remainingDays} يوم` : '';
    
//     if (subscriptionTitle) subscriptionTitle.textContent = `📦 ${displayName}`;
//     if (subscriptionDetails) subscriptionDetails.textContent = `${endDateText ? `تنتهي في ${endDateText}` : ''}${remainingText ? ` • ${remainingText}` : ''}`;
    
//     if (endDate && subscriptionCountdown) {
//       setupCountdown(subscriptionCountdown, endDate);
//     }
//     return;
//   }

//   if (packageStatus === 'قيد الدفع') {
//     const displayName = packageName || (packageId ? `ID ${packageId}` : 'غير معروفة');
//     if (subscriptionTitle) subscriptionTitle.textContent = `⏳ ${displayName}`;
//     if (subscriptionDetails) subscriptionDetails.textContent = 'قيد الدفع - ارفق إيصال الدفع لتفعيل الباقة';
//     if (subscriptionCountdown) subscriptionCountdown.textContent = 'في الانتظار';
//     return;
//   }

//   if (packageStatus === 'منتهية') {
//     const displayName = packageName || (packageId ? `ID ${packageId}` : 'غير معروفة');
//     const endDateText = endDate ? endDate.toISOString().split('T') : '';
//     if (subscriptionTitle) subscriptionTitle.textContent = `❌ ${displayName}`;
//     if (subscriptionDetails) subscriptionDetails.textContent = `انتهت${endDateText ? ` في ${endDateText}` : ''} - جدد اشتراكك من قسم الباقات`;
//     if (subscriptionCountdown) subscriptionCountdown.textContent = 'منتهية';
//     return;
//   }

//   // حالات أخرى
//   const displayName = packageName || (packageId ? `ID ${packageId}` : 'غير معروفة');
//   if (subscriptionTitle) subscriptionTitle.textContent = `📋 ${displayName}`;
//   if (subscriptionDetails) subscriptionDetails.textContent = `الحالة: ${packageStatus}`;
//   if (subscriptionCountdown) subscriptionCountdown.textContent = '';
// }

// function hideSubscriptionBar() {
//   const subscriptionBar = document.getElementById('subscriptionStatusBar');
//   if (subscriptionBar) subscriptionBar.style.display = 'none';
// }

// /* ========================= تسجيل الدخول والمصادقة ========================= */
// function setupAuthUI() {
//   const loginBtn = document.getElementById('loginBtn');
//   const logoutBtn = document.getElementById('logoutBtn');
//   const loginModal = document.getElementById('loginModal');
//   const loginCancel = document.getElementById('loginCancel');
//   const loginForm = document.getElementById('loginForm');

//   if (loginBtn) {
//     loginBtn.addEventListener('click', () => {
//       if (loginModal) loginModal.style.display = 'flex';
//     });
//   }
  
//   if (loginCancel) {
//     loginCancel.addEventListener('click', () => {
//       if (loginModal) loginModal.style.display = 'none';
//     });
//   }
  
//   if (loginModal) {
//     loginModal.addEventListener('click', ev => {
//       if (ev.target === loginModal) loginModal.style.display = 'none';
//     });
//   }
  
//   if (loginForm) loginForm.addEventListener('submit', handleLoginSubmit);
//   if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

//   // تحقق من وجود بيانات مسجلة مسبقاً
//   const stored = getLoggedPlace();
//   if (stored) {
//     setLoggedInUI(stored);
//   }
  
//   updateAdsTabVisibility();
// }

// async function handleLoginSubmit(ev) {
//   ev.preventDefault();
//   showLoading(true);
  
//   try {
//     const form = ev.target;
//     const phoneOrId = form.querySelector('input[name="phoneOrId"]').value.trim();
//     const password = form.querySelector('input[name="password"]').value.trim();
    
//     if (!phoneOrId || !password) {
//       showError('الرجاء إدخال رقم/ID وكلمة المرور');
//       return;
//     }

//     const resp = await apiPost({ 
//       action: 'loginPlace', 
//       phoneOrId: phoneOrId, 
//       password: password 
//     });
    
//     if (!resp.ok) {
//       throw new Error('خطأ في الاتصال بالخادم');
//     }

//     const data = resp.data;
    
//     if (!data || data.success === false) {
//       const errorMsg = (data && data.error) ? data.error : 'خطأ غير معروف';
//       throw new Error(errorMsg);
//     }

//     // استخراج بيانات المكان
//     let placeObj = null;
//     if (data.data && data.data.place) {
//       placeObj = data.data.place;
//     } else if (data.place) {
//       placeObj = data.place;
//     } else {
//       throw new Error('لم يتم العثور على بيانات المكان في الاستجابة');
//     }

//     if (!placeObj || !placeObj.id) {
//       throw new Error('بيانات المكان غير مكتملة');
//     }

//     await setLoggedInUI(placeObj);
//     showSuccess('تم تسجيل الدخول بنجاح');
    
//   } catch (err) {
//     console.error('Login error:', err);
//     showError(err.message || 'خطأ أثناء تسجيل الدخول');
//   } finally {
//     showLoading(false);
//   }
// }

// function handleLogout() {
//   setLoggedOutUI();
//   showSuccess('تم تسجيل الخروج');
// }

// async function setLoggedInUI(place) {
//   const loginBtn = document.getElementById('loginBtn');
//   const logoutBtn = document.getElementById('logoutBtn');
//   const loggedInUser = document.getElementById('loggedInUser');
//   const loginModal = document.getElementById('loginModal');

//   if (loginBtn) loginBtn.style.display = 'none';
//   if (logoutBtn) logoutBtn.style.display = 'inline-block';
//   if (loginModal) loginModal.style.display = 'none';
  
//   if (loggedInUser) {
//     loggedInUser.style.display = 'inline-flex';
//     const nameSpan = loggedInUser.querySelector('span');
//     if (nameSpan) {
//       const name = (place && (place.name || (place.raw && place.raw['اسم المكان']))) || 'صاحب المحل';
//       nameSpan.textContent = name;
//     }
//   }

//   // تطبيع اسم المكان
//   if (place && !place.name && place.raw && place.raw['اسم المكان']) {
//     place.name = place.raw['اسم المكان'];
//   }

//   setLoggedPlace(place);
  
//   await loadLookupsAndPopulate();
//   await tryPrefillPlaceForm(place);
  
//   // إظهار تبويب الإعلانات وضبط قوائم الأماكن
//   updateAdsTabVisibility();
  
//   const placeSelects = document.querySelectorAll('select[name="placeId"]');
//   placeSelects.forEach(select => {
//     select.value = place.id;
//     select.disabled = true;
//   });

//   if (place.id) {
//     checkAdQuotaAndToggle(place.id);
//     loadAdsForPlace(place.id);
//   }

//   showPlaceStatusBar(place);
//   await refreshSubscriptionBar();
// }

// function setLoggedOutUI() {
//   const loginBtn = document.getElementById('loginBtn');
//   const logoutBtn = document.getElementById('logoutBtn');
//   const loggedInUser = document.getElementById('loggedInUser');

//   if (loginBtn) loginBtn.style.display = 'inline-block';
//   if (logoutBtn) logoutBtn.style.display = 'none';
  
//   if (loggedInUser) {
//     loggedInUser.style.display = 'none';
//     const nameSpan = loggedInUser.querySelector('span');
//     if (nameSpan) nameSpan.textContent = '';
//   }
  
//   clearLoggedPlace();
//   hidePlaceStatusBar();
//   hideSubscriptionBar();
  
//   updateAdsTabVisibility();
  
//   const placeSelects = document.querySelectorAll('select[name="placeId"]');
//   placeSelects.forEach(select => {
//     select.disabled = false;
//   });
// }

// function getLoggedPlace() {
//   try {
//     const raw = localStorage.getItem('khedmatak_place');
//     return raw ? JSON.parse(raw) : null;
//   } catch {
//     return null;
//   }
// }

// function setLoggedPlace(obj) {
//   try {
//     localStorage.setItem('khedmatak_place', JSON.stringify(obj));
//   } catch {}
// }

// function clearLoggedPlace() {
//   try {
//     localStorage.removeItem('khedmatak_place');
//   } catch {}
// }

// /* ========================= حفظ المكان ========================= */
// async function handlePlaceSubmit(ev) {
//   ev.preventDefault();
//   showLoading(true);
  
//   const submitBtn = document.getElementById('savePlaceBtn');
//   const originalText = submitBtn ? submitBtn.innerHTML : '';
  
//   if (submitBtn) {
//     submitBtn.disabled = true;
//     submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحفظ...';
//   }
  
//   try {
//     const formData = new FormData(ev.target);
//     const placeData = extractPlaceFormData(formData);
    
//     if (!validateFiles()) {
//       return;
//     }

//     // رفع الصورة إذا وجدت
//     let imageUrl = '';
//     if (placeData.image && placeData.image.length > 0) {
//       const logged = getLoggedPlace();
//       const placeId = (logged && logged.id) ? logged.id : null;
//       imageUrl = await uploadToGoogleDrive(placeData.image, 'places', placeId);
//     }

//     // إعداد البيانات للإرسال
//     const payload = buildPlacePayload(placeData, imageUrl);
    
//     const resp = await apiPost(payload);
//     if (!resp.ok) {
//       throw new Error('فشل في التواصل مع الخادم');
//     }
    
//     const data = resp.data;
//     if (!data || data.success === false) {
//       throw new Error(data.error || 'فشل حفظ المكان');
//     }

//     // معالجة الاستجابة
//     await handlePlaceSaveResponse(data);
    
//     showSuccess('تم حفظ المكان بنجاح!');
//     clearImagePreview();
    
//     await refreshSubscriptionBar();
//     await loadPlacesForAds();
    
//   } catch (err) {
//     console.error('handlePlaceSubmit error', err);
//     showError(err.message || 'حدث خطأ أثناء حفظ المكان');
//   } finally {
//     showLoading(false);
//     if (submitBtn) {
//       submitBtn.disabled = false;
//       submitBtn.innerHTML = originalText || '<i class="fas fa-save"></i> حفظ بيانات المكان';
//     }
//   }
// }

// function extractPlaceFormData(formData) {
//   return {
//     placeName: formData.get('placeName'),
//     password: formData.get('password'),
//     activityType: formData.get('activityType'),
//     city: formData.get('city'),
//     area: formData.get('area'),
//     location: formData.get('location'),
//     detailedAddress: formData.get('detailedAddress'),
//     mapLink: formData.get('mapLink'),
//     phone: formData.get('phone'),
//     whatsappLink: formData.get('whatsappLink'),
//     email: formData.get('email'),
//     website: formData.get('website'),
//     workingHours: formData.get('workingHours'),
//     delivery: formData.get('delivery'),
//     description: formData.get('description'),
//     image: uploadedImages
//   };
// }

// function buildPlacePayload(placeData, imageUrl) {
//   const logged = getLoggedPlace();
//   const payload = { 
//     action: (logged && logged.id) ? 'updatePlace' : 'registerPlace' 
//   };
  
//   if (logged && logged.id) {
//     payload.placeId = logged.id;
//   }

//   const fieldMap = {
//     name: placeData.placeName,
//     password: placeData.password,
//     activityId: placeData.activityType,
//     city: placeData.city,
//     area: placeData.area,
//     mall: placeData.location,
//     address: placeData.detailedAddress,
//     mapLink: placeData.mapLink,
//     phone: placeData.phone,
//     whatsappLink: placeData.whatsappLink,
//     email: placeData.email,
//     website: placeData.website,
//     hours: placeData.workingHours,
//     delivery: placeData.delivery,
//     description: placeData.description,
//     logoUrl: imageUrl
//   };

//   for (const [key, value] of Object.entries(fieldMap)) {
//     if (value !== undefined && value !== null && String(value).trim() !== '') {
//       payload[key] = value;
//     }
//   }

//   return payload;
// }

// async function handlePlaceSaveResponse(data) {
//   const returned = data.data || data;
  
//   if (returned.place) {
//     await setLoggedInUI(returned.place);
//   } else if (returned.id) {
//     const fetched = await fetchPlace(returned.id);
//     if (fetched) {
//       await setLoggedInUI(fetched);
//     }
//   }
  
//   const newLogged = getLoggedPlace();
//   if (newLogged && newLogged.id) {
//     checkAdQuotaAndToggle(newLogged.id);
//     loadAdsForPlace(newLogged.id);
//   }
// }

// async function fetchPlace(placeId) {
//   if (!placeId) return null;
  
//   try {
//     const resp = await apiPost({ action: 'getDashboard', placeId: placeId });
//     if (!resp.ok || !resp.data) return null;
    
//     const data = resp.data;
//     if (!data || data.success === false) return null;
    
//     return (data.data && data.data.place) ? data.data.place : null;
//   } catch (e) {
//     return null;
//   }
// }

// /* ========================= الإعلانات ========================= */
// async function loadPlacesForAds() {
//   const placeSelects = document.querySelectorAll('select[name="placeId"]');
//   placeSelects.forEach(select => {
//     select.innerHTML = '<option value="">اختر المكان</option>';
//   });
  
//   try {
//     const resp = await apiFetch(`${API_URL}?action=places`);
//     if (!resp.ok) {
//       updateAdsTabVisibility();
//       return;
//     }
    
//     const json = resp.data;
//     let places = [];
    
//     if (json && json.success && json.data && Array.isArray(json.data.places)) {
//       places = json.data.places;
//     } else if (json && Array.isArray(json.places)) {
//       places = json.places;
//     } else if (Array.isArray(json)) {
//       places = json;
//     }

//     places.forEach(place => {
//       placeSelects.forEach(select => {
//         const opt = document.createElement('option');
//         opt.value = place.id;
//         opt.textContent = place.name;
//         select.appendChild(opt);
//       });
//     });

//     // ضبط المكان المسجل دخوله
//     const logged = getLoggedPlace();
//     if (logged && logged.id) {
//       placeSelects.forEach(select => {
//         select.value = logged.id;
//         select.disabled = true;
//       });
//       loadAdsForPlace(logged.id);
//     } else {
//       placeSelects.forEach(select => {
//         select.disabled = false;
//       });
//     }
    
//   } catch (err) {
//     console.error('loadPlacesForAds error', err);
//   }
  
//   updateAdsTabVisibility();
// }

// async function loadAdsForPlace(placeId) {
//   if (!placeId) return;
  
//   try {
//     const resp = await apiFetch(`${API_URL}?action=ads&placeId=${encodeURIComponent(placeId)}`);
//     if (!resp.ok) {
//       console.warn('loadAdsForPlace failed', resp);
//       return;
//     }
    
//     const json = resp.data;
//     let ads = [];
    
//     if (json && json.success && json.data && json.data.ads) {
//       ads = json.data.ads;
//     } else if (json && json.ads) {
//       ads = json.ads;
//     }
    
//     renderAdsList(Array.isArray(ads) ? ads : []);
//   } catch (err) {
//     console.error('loadAdsForPlace error', err);
//   }
// }

// function renderAdsList(ads) {
//   const container = document.getElementById('adsListContainer');
//   if (!container) return;
  
//   container.innerHTML = '';
  
//   if (!ads || ads.length === 0) {
//     container.innerHTML = '<p>لا توجد إعلانات حالياً لهذا المحل.</p>';
//     return;
//   }
  
//   ads.forEach(ad => {
//     const card = createAdCard(ad);
//     container.appendChild(card);
//   });
// }

// function createAdCard(ad) {
//   const card = document.createElement('div');
//   card.className = 'ad-card';
  
//   // العنوان
//   const title = document.createElement('h4');
//   title.textContent = ad.title || '(بدون عنوان)';
//   card.appendChild(title);
  
//   // المعلومات الأساسية
//   const meta = document.createElement('div');
//   meta.className = 'meta';
//   meta.textContent = `${ad.startDate || ''} — ${ad.endDate || ''} • الحالة: ${ad.status || ''}`;
//   card.appendChild(meta);
  
//   // الوصف
//   const description = document.createElement('p');
//   description.textContent = ad.description || '';
//   card.appendChild(description);
  
//   // الصور
//   if (ad.images && ad.images.length > 0) {
//     const imagesContainer = createAdImages(ad.images);
//     card.appendChild(imagesContainer);
//   }
  
//   // أزرار التحكم
//   const actions = createAdActions(ad);
//   card.appendChild(actions);
  
//   return card;
// }

// function createAdImages(images) {
//   const container = document.createElement('div');
//   container.className = 'ad-images';
  
//   const imagesArray = Array.isArray(images) ? images : 
//     (typeof images === 'string' ? JSON.parse(images) : []);
  
//   imagesArray.forEach(image => {
//     let url = '', name = '';
    
//     if (image && typeof image === 'object') {
//       url = image.url || '';
//       name = image.name || '';
//     } else if (typeof image === 'string') {
//       name = image;
//       url = '';
//     }
    
//     if (!url && name && recentUploads[name]) {
//       url = recentUploads[name].url;
//     }
    
//     if (url) {
//       const img = document.createElement('img');
//       img.src = url;
//       img.alt = name || '';
//       container.appendChild(img);
//     }
//   });
  
//   return container;
// }

// function createAdActions(ad) {
//   const actions = document.createElement('div');
//   actions.className = 'ad-actions';
  
//   const editBtn = document.createElement('button');
//   editBtn.className = 'btn';
//   editBtn.textContent = 'تعديل';
//   editBtn.onclick = () => startEditAd(ad);
  
//   const deleteBtn = document.createElement('button');
//   deleteBtn.className = 'btn btn-secondary';
//   deleteBtn.textContent = 'حذف';
//   deleteBtn.onclick = () => deleteAdConfirm(ad.id);
  
//   actions.appendChild(editBtn);
//   actions.appendChild(deleteBtn);
  
//   return actions;
// }

// async function handleAdSubmit(ev) {
//   ev.preventDefault();
//   showLoading(true);
  
//   try {
//     const formData = new FormData(ev.target);
//     const adData = extractAdFormData(formData);
    
//     if (!validateFiles()) {
//       return;
//     }

//     // رفع الصور
//     const imageUrls = await uploadAdImages(adData.images);
    
//     // رفع الفيديو
//     let videoUrl = '';
//     if (adData.video && adData.video.length > 0) {
//       videoUrl = await uploadToGoogleDrive(adData.video, 'ads');
//     }

//     // تحضير البيانات للإرسال
//     const payload = buildAdPayload(adData, imageUrls, videoUrl);
    
//     if (editingAdId) {
//       await updateAd(payload);
//     } else {
//       await createNewAd(payload);
//     }
    
//     // تنظيف النموذج
//     clearAdForm(ev.target);
    
//   } catch (err) {
//     console.error('handleAdSubmit error', err);
//     showError(err.message || 'حدث خطأ أثناء حفظ الإعلان');
//   } finally {
//     showLoading(false);
//   }
// }

// function extractAdFormData(formData) {
//   return {
//     placeId: formData.get('placeId'),
//     adType: formData.get('adType'),
//     adTitle: formData.get('adTitle'),
//     coupon: formData.get('coupon'),
//     adDescription: formData.get('adDescription'),
//     startDate: formData.get('startDate'),
//     endDate: formData.get('endDate'),
//     adStatus: formData.get('adStatus'),
//     adActiveStatus: formData.get('adActiveStatus'),
//     images: uploadedImages,
//     video: uploadedVideos
//   };
// }

// async function uploadAdImages(images) {
//   const imageUrls = [];
//   const maxImages = Math.min(images.length, 8);
  
//   for (let i = 0; i < maxImages; i++) {
//     const file = images[i];
//     const url = await uploadToGoogleDrive(file, 'ads');
//     imageUrls.push({ name: file.name, url });
//     recentUploads[file.name] = { url, name: file.name };
//   }
  
//   return imageUrls;
// }

// function buildAdPayload(adData, imageUrls, videoUrl) {
//   const logged = getLoggedPlace();
//   const placeId = adData.placeId || (logged && logged.id) || '';
  
//   return {
//     placeId: placeId,
//     adType: adData.adType,
//     adTitle: adData.adTitle,
//     adDescription: adData.adDescription,
//     startDate: adData.startDate,
//     endDate: adData.endDate,
//     coupon: adData.coupon || '',
//     imageFiles: JSON.stringify(imageUrls.map(img => img.name || '')),
//     imageUrls: JSON.stringify(imageUrls.map(img => img.url || '')),
//     videoFile: adData.video && adData.video.length > 0 ? (adData.video.name || '') : '',
//     videoUrl: videoUrl || '',
//     adStatus: adData.adStatus || '',
//     adActiveStatus: adData.adActiveStatus || ''
//   };
// }

// async function updateAd(payload) {
//   const resp = await apiPost({ 
//     action: 'updateAd', 
//     adId: editingAdId, 
//     ...payload 
//   });
  
//   if (!resp.ok) {
//     throw new Error('فشل تحديث الإعلان');
//   }
  
//   const data = resp.data;
//   if (data && data.success === false) {
//     throw new Error(data.error || 'فشل تحديث الإعلان');
//   }
  
//   showSuccess('تم تحديث الإعلان');
  
//   const logged = getLoggedPlace();
//   if (logged && logged.id) {
//     await loadAdsForPlace(logged.id);
//   }
  
//   editingAdId = null;
//   const submitBtn = document.querySelector('#adForm button[type="submit"]');
//   if (submitBtn) submitBtn.textContent = 'حفظ الإعلان';
// }

// async function createNewAd(payload) {
//   const resp = await apiPost({ action: 'addAd', ...payload });
  
//   if (!resp.ok) {
//     throw new Error('فشل حفظ الإعلان');
//   }
  
//   const data = resp.data;
//   if (data && data.success === false) {
//     throw new Error(data.error || 'فشل حفظ الإعلان');
//   }
  
//   showSuccess('تم حفظ الإعلان');
  
//   const logged = getLoggedPlace();
//   if (logged && logged.id) {
//     await checkAdQuotaAndToggle(logged.id);
//     await loadAdsForPlace(logged.id);
//   }
// }

// async function deleteAdConfirm(adId) {
//   if (!confirm('هل أنت متأكد من حذف هذا الإعلان؟ لا يمكن التراجع.')) {
//     return;
//   }
  
//   try {
//     const resp = await apiPost({ action: 'deleteAd', adId: adId });
    
//     if (!resp.ok) {
//       throw new Error('فشل حذف الإعلان');
//     }
    
//     const data = resp.data;
//     if (data && data.success === false) {
//       throw new Error(data.error || 'فشل حذف الإعلان');
//     }
    
//     showSuccess('تم حذف الإعلان');
    
//     const logged = getLoggedPlace();
//     if (logged && logged.id) {
//       checkAdQuotaAndToggle(logged.id);
//       loadAdsForPlace(logged.id);
//     }
//   } catch (err) {
//     console.error('deleteAd error', err);
//     showError(err.message || 'خطأ أثناء حذف الإعلان');
//   }
// }

// /* ========================= حصة الإعلانات ========================= */
// async function checkAdQuotaAndToggle(placeId) {
//   try {
//     if (!placeId) {
//       const tabAds = document.getElementById('tab-ads');
//       if (tabAds) tabAds.style.display = 'none';
//       return;
//     }
    
//     const resp = await apiFetch(`${API_URL}?action=remainingAds&placeId=${encodeURIComponent(placeId)}`);
//     if (!resp.ok) {
//       toggleAdFormAllowed(false, 'تعذر التحقق من الباقة');
//       return;
//     }
    
//     const data = resp.data.data || resp.data;
//     const remaining = Number(data.remaining || 0);
//     const allowed = Number(data.allowed || 0);
//     const used = Number(data.used || 0);
    
//     showAdQuotaMessage(`الإعلانات: الكل ${allowed} • المستخدمة ${used} • المتبقي ${remaining}`);
//     toggleAdFormAllowed(remaining > 0, remaining > 0 ? '' : 'استنفدت حصة الإعلانات');
    
//   } catch (err) {
//     console.error('checkAdQuotaAndToggle', err);
//     toggleAdFormAllowed(false, 'خطأ أثناء التحقق');
//   }
// }

// function toggleAdFormAllowed(allowed, message) {
//   const adForm = document.getElementById('adForm');
//   if (!adForm) return;
  
//   const submitBtn = adForm.querySelector('button[type="submit"]');
//   if (submitBtn) {
//     submitBtn.disabled = !allowed;
//     submitBtn.style.opacity = allowed ? '1' : '0.6';
//     submitBtn.title = allowed ? '' : (message || 'غير مسموح');
//   }
  
//   updateAdQuotaNotice(message);
// }

// function updateAdQuotaNotice(message) {
//   let notice = document.getElementById('adQuotaNotice');
  
//   if (!notice) {
//     const container = document.getElementById('ads-tab');
//     if (!container) return;
    
//     notice = document.createElement('div');
//     notice.id = 'adQuotaNotice';
//     notice.style.cssText = `
//       background: #fff3cd;
//       color: #856404;
//       padding: 10px;
//       border-radius: 6px;
//       margin-top: 12px;
//       display: none;
//     `;
//     container.insertBefore(notice, container.firstChild.nextSibling);
//   }
  
//   notice.textContent = message || '';
//   notice.style.display = message ? 'block' : 'none';
// }

// function showAdQuotaMessage(text) {
//   let element = document.getElementById('adQuotaSummary');
  
//   if (!element) {
//     const container = document.getElementById('ads-tab');
//     if (!container) return;
    
//     element = document.createElement('p');
//     element.id = 'adQuotaSummary';
//     element.style.cssText = 'margin-top: 8px; color: #333;';
//     container.insertBefore(element, container.firstChild.nextSibling);
//   }
  
//   element.textContent = text || '';
// }

// function updateAdsTabVisibility() {
//   const adsTab = document.getElementById('tab-ads');
//   if (!adsTab) return;
  
//   const logged = getLoggedPlace();
  
//   if (logged && logged.id) {
//     adsTab.style.display = 'block';
//   } else {
//     adsTab.style.display = 'none';
    
//     // إذا كان التبويب الحالي هو الإعلانات، انتقل للأماكن
//     const activeTab = document.querySelector('.tab.active');
//     if (!activeTab || activeTab.id === 'tab-ads') {
//       showTab('places');
//     }
//   }
// }

// /* ========================= المعاينات والرفع ========================= */
// function previewImage(input, previewId) {
//   const preview = document.getElementById(previewId);
//   if (!preview) return;
  
//   preview.innerHTML = '';
  
//   if (input.files && input.files) {
//     const file = input.files;
//     const reader = new FileReader();
    
//     reader.onload = e => {
//       const img = document.createElement('img');
//       img.src = e.target.result;
//       preview.appendChild(img);
//       uploadedImages = [file];
//     };
    
//     reader.readAsDataURL(file);
//   }
// }

// function previewMultipleImages(input, previewId) {
//   const preview = document.getElementById(previewId);
//   if (!preview) return;
  
//   preview.innerHTML = '';
//   uploadedImages = [];
  
//   if (!input.files) return;
  
//   const files = Array.from(input.files).slice(0, 8);
//   if (input.files.length > 8) {
//     showError('يمكن تحميل حتى 8 صور كحد أقصى. سيتم أخذ أول 8 صور.');
//   }
  
//   files.forEach(file => {
//     const reader = new FileReader();
    
//     reader.onload = e => {
//       const container = document.createElement('div');
//       container.className = 'preview-image';
      
//       const img = document.createElement('img');
//       img.src = e.target.result;
      
//       const removeBtn = document.createElement('button');
//       removeBtn.className = 'remove-image';
//       removeBtn.innerHTML = '×';
//       removeBtn.onclick = () => {
//         container.remove();
//         uploadedImages = uploadedImages.filter(f => f !== file);
//       };
      
//       container.appendChild(img);
//       container.appendChild(removeBtn);
//       preview.appendChild(container);
//       uploadedImages.push(file);
//     };
    
//     reader.readAsDataURL(file);
//   });
// }

// function previewVideo(input, previewId) {
//   const preview = document.getElementById(previewId);
//   if (!preview) return;
  
//   preview.innerHTML = '';
//   uploadedVideos = [];
  
//   if (input.files && input.files) {
//     const file = input.files;
//     const reader = new FileReader();
    
//     reader.onload = e => {
//       const video = document.createElement('video');
//       video.src = e.target.result;
//       video.controls = true;
//       video.style.width = '100%';
//       preview.appendChild(video);
//       uploadedVideos = [file];
//     };
    
//     reader.readAsDataURL(file);
//   }
// }

// async function readFileAsBase64(file) {
//   return new Promise((resolve, reject) => {
//     const reader = new FileReader();
    
//     reader.onload = () => {
//       const result = reader.result;
//       const base64 = String(result).split(',')[1] || '';
//       resolve(base64);
//     };
    
//     reader.onerror = reject;
//     reader.readAsDataURL(file);
//   });
// }

// async function uploadToGoogleDrive(file, folder, placeId = null) {
//   if (!API_URL || !API_URL.startsWith('http')) {
//     return `https://drive.google.com/file/d/${Math.random().toString(36).substr(2, 9)}/view`;
//   }
  
//   const base64 = await readFileAsBase64(file);
  
//   const form = new FormData();
//   form.append('action', 'uploadFile');
//   form.append('folder', folder);
//   form.append('fileName', file.name);
//   form.append('mimeType', file.type || 'application/octet-stream');
//   form.append('fileData', base64);
  
//   if (placeId) {
//     form.append('placeId', placeId);
//   }
  
//   const resp = await apiPost(form);
  
//   if (!resp.ok) {
//     throw new Error('فشل رفع الملف');
//   }
  
//   const data = resp.data;
//   const uploadResult = (data && data.data) ? data.data : data;
//   const fileUrl = (uploadResult && (uploadResult.fileUrl || uploadResult.url)) || '';
  
//   if (fileUrl) {
//     recentUploads[file.name] = { url: fileUrl, name: file.name };
//   }
  
//   if (!fileUrl) {
//     throw new Error('تعذر استخراج رابط الملف من استجابة الخادم');
//   }
  
//   return fileUrl;
// }

// function validateFiles() {
//   const maxImageSize = 10 * 1024 * 1024;   // 10MB
//   const maxVideoSize = 50 * 1024 * 1024;   // 50MB
//   const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
//   const allowedVideoTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/quicktime'];

//   for (let img of uploadedImages) {
//     if (img.size > maxImageSize) {
//       showError('حجم الصورة أكبر من 10MB');
//       return false;
//     }
//     if (!allowedImageTypes.includes(img.type)) {
//       showError('نوع الصورة غير مدعوم. الأنواع المسموحة: JPEG, PNG, GIF, WebP');
//       return false;
//     }
//   }
  
//   if (uploadedVideos.length > 0) {
//     const video = uploadedVideos;
//     if (video.size > maxVideoSize) {
//       showError('حجم الفيديو أكبر من 50MB');
//       return false;
//     }
//     if (!allowedVideoTypes.includes(video.type)) {
//       showError('نوع الفيديو غير مدعوم. الأنواع المسموحة: MP4, AVI, MOV');
//       return false;
//     }
//   }
  
//   return true;
// }

// /* ========================= خصائص الخريطة والموقع ========================= */
// function initMapFeatures() {
//   initMapLinkAutoFill();
//   initMapAutoLocate();
// }

// function initMapLinkAutoFill() {
//   const mapInput = document.querySelector('input[name="mapLink"]');
//   if (!mapInput) return;
  
//   let timer = null;
  
//   const processMapLink = () => {
//     const value = mapInput.value;
//     if (value && value.trim() !== '') {
//       autoFillFromMapLink(value.trim());
//     }
//   };
  
//   mapInput.addEventListener('blur', processMapLink);
//   mapInput.addEventListener('input', () => {
//     if (timer) clearTimeout(timer);
//     timer = setTimeout(processMapLink, 900);
//   });
// }

// function initMapAutoLocate() {
//   const btn = document.getElementById('autoLocateBtn');
//   if (!btn) return;
  
//   btn.addEventListener('click', async () => {
//     btn.disabled = true;
//     const originalText = btn.textContent;
//     btn.textContent = 'جاري تحديد الموقع...';
    
//     await attemptAutoLocate(true);
    
//     btn.disabled = false;
//     btn.textContent = originalText;
//   });
  
//   // محاولة تلقائية عند التحميل
//   setTimeout(() => {
//     try { 
//       attemptAutoLocate(false); 
//     } catch {} 
//   }, 900);
// }

// async function attemptAutoLocate(showMessages = true) {
//   const mapInput = document.querySelector('input[name="mapLink"]');
  
//   // لا تحاول إذا كان هناك رابط موجود
//   if (mapInput && mapInput.value && mapInput.value.trim() !== '') {
//     return;
//   }
  
//   try {
//     if (showMessages) {
//       showSuccess('جاري محاولة تحديد موقعك...');
//     }
    
//     const position = await getCurrentPosition();
//     const lat = position.coords.latitude;
//     const lng = position.coords.longitude;
    
//     await handlePositionAndFill(lat, lng);
    
//     if (showMessages) {
//       showSuccess('تم تحديد الموقع وملأ الحقول تلقائياً');
//     }
//   } catch (err) {
//     if (showMessages) {
//       showError('تعذر الحصول على الموقع. تأكد من منح الإذن أو اضغط "استخدم موقعي"');
//     }
//   }
// }

// function getCurrentPosition(options = { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }) {
//   return new Promise((resolve, reject) => {
//     if (!navigator.geolocation) {
//       reject(new Error('Geolocation not supported'));
//       return;
//     }
    
//     navigator.geolocation.getCurrentPosition(
//       position => resolve(position),
//       error => reject(error),
//       options
//     );
//   });
// }

// async function handlePositionAndFill(lat, lng) {
//   try {
//     // ملء رابط الخريطة
//     const mapInput = document.querySelector('input[name="mapLink"]');
//     if (mapInput) {
//       const googleMapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lat + ',' + lng)}`;
//       mapInput.value = googleMapsLink;
      
//       // إطلاق أحداث التغيير
//       mapInput.dispatchEvent(new Event('input', { bubbles: true }));
//       mapInput.dispatchEvent(new Event('change', { bubbles: true }));
//     }
    
//     // الحصول على معلومات العنوان
//     const geocodeData = await reverseGeocode(lat, lng);
//     if (!geocodeData) return;
    
//     const address = geocodeData.address || {};
//     const detailedAddress = geocodeData.display_name || '';
    
//     // ملء العنوان التفصيلي
//     const addressInput = document.querySelector('input[name="detailedAddress"]');
//     if (addressInput && (!addressInput.value || addressInput.value.trim() === '')) {
//       addressInput.value = detailedAddress;
//     }
    
//     // ملء المدينة
//     const cityOptions = [address.city, address.town, address.village, address.county, address.state];
//     const cityValue = cityOptions.find(Boolean);
//     if (cityValue) {
//       await setSelectValueWhenReady('select[name="city"]', cityValue);
//       updateAreas(); // تحديث المناطق
//     }
    
//     // ملء المنطقة
//     const areaOptions = [address.suburb, address.neighbourhood, address.hamlet, address.village, address.city_district];
//     const areaValue = areaOptions.find(Boolean);
//     if (areaValue) {
//       await setSelectValueWhenReady('select[name="area"]', areaValue);
//     }
    
//   } catch (e) {
//     console.error('handlePositionAndFill error', e);
//   }
// }

// async function reverseGeocode(lat, lng) {
//   try {
//     const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&addressdetails=1`;
//     const response = await fetch(url, {
//       headers: {
//         'Accept': 'application/json',
//         'User-Agent': 'Khedmatak-App/1.0 (contact@example.com)'
//       }
//     });
    
//     if (!response.ok) return null;
//     return await response.json();
//   } catch (e) {
//     console.warn('reverseGeocode error', e);
//     return null;
//   }
// }

// async function autoFillFromMapLink(url) {
//   if (!url || String(url).trim() === '') return;
  
//   const coords = parseLatLngFromMapLink(url);
//   if (!coords) return;
  
//   const geocodeData = await reverseGeocode(coords.lat, coords.lng);
//   if (!geocodeData) return;
  
//   const address = geocodeData.address || {};
//   const detailedAddress = geocodeData.display_name || '';
  
//   // ملء العنوان التفصيلي
//   const addressInput = document.querySelector('input[name="detailedAddress"]');
//   if (addressInput && (!addressInput.value || addressInput.value.trim() === '')) {
//     addressInput.value = detailedAddress;
//   }
  
//   // ملء المدينة والمنطقة
//   const cityOptions = [address.city, address.town, address.village, address.county, address.state];
//   const areaOptions = [address.suburb, address.neighbourhood, address.hamlet, address.village, address.city_district];
  
//   const cityValue = cityOptions.find(Boolean);
//   if (cityValue) {
//     await setSelectValueWhenReady('select[name="city"]', cityValue);
//     updateAreas();
//   }



























































// // ============ إعدادات عامة ====================
// const API_URL = 'https://script.google.com/macros/s/AKfycbwB0VE5COC0e6NQNKrxQeNRu2Mtt_QuMbVoBrH7tE6Da3X3BP6UxK926bt9fDO0WPU5/exec';
// let currentTab = 'places';
// let uploadedImages = [];
// let uploadedVideos = [];
// let editingAdId = null;
// const recentUploads = {};
// const THEME_KEY = 'khedmatak_theme';

// // ============ الثيم ====================
// document.addEventListener('DOMContentLoaded', () => {
//   initTheme();
//   document.getElementById('themeToggleBtn')?.addEventListener('click', toggleTheme);
//   setupAuthUI();
//   setupEventListeners();
//   loadLookupsAndPopulate();
//   initMapFeatures();
// });

// function initTheme() {
//   try {
//     const saved = localStorage.getItem(THEME_KEY);
//     if (saved) applyTheme(saved);
//     else {
//       const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
//       applyTheme(prefersDark ? 'dark' : 'light');
//     }
//   } catch {}
// }
// function applyTheme(theme) {
//   document.body.classList.toggle('dark', theme === 'dark');
//   const icon = document.getElementById('themeIcon');
//   icon.classList.toggle('fas fa-sun', theme === 'light');
//   icon.classList.toggle('fas fa-moon', theme === 'dark');
// }
// function toggleTheme() {
//   const cur = document.body.classList.contains('dark') ? 'light' : 'dark';
//   applyTheme(cur);
// }

// // ============ API ====================
// async function apiFetch(url, opts = {}) {
//   try {
//     const res = await fetch(url, opts);
//     const text = await res.text();
//     let data; try { data = JSON.parse(text); } catch { data = text; }
//     return { ok: res.ok, status: res.status, data, raw: text };
// }
// async function apiPost(payload) {
//   try {
//     let body; let headers = {};
//     if (payload instanceof FormData) body = payload;
//     else if (payload && typeof payload === 'object') {
//       const form = new FormData();
//       for (const k of Object.keys(payload)) {
//         const v = payload[k];
//         form.append(k, (v !== null && typeof v === 'object') ? JSON.stringify(v) : (v ?? ''));
//       }
//       body = form;
//     } else {
//       headers['Content-Type'] = 'text/plain';
//       body = String(payload);
//     }
//     const res = await fetch(API_URL, { method: 'POST', body, headers });
//     const text = await res.text();
//     let data; try { data = JSON.parse(text); } catch { data = { success: false, error: 'Invalid JSON' }; }
//     return { ok: res.ok, status: res.status, data, raw: text };
// }

// // ============ تحميل القوائم ====================
// async function loadLookupsAndPopulate() {
//   try {
//     const resp = await apiFetch(`${API_URL}?action=getLookups`);
//     if (!resp.ok) return;
//     const data = resp.data;
//     if (!data) return;

//     window.lastLookups = data;
//     populateSelect('#activityType', data.activities, 'اختر نوع النشاط');
//     populateSelect('#city', data.cities, 'اختر المدينة');
//     setupCityAreaMap(data.areas);
//     populateSelect('#location', data.sites, 'اختر الموقع');

//     window.availablePaymentMethods = (data.paymentsMethods || []).map(pm => ({
//       id: pm.id || (pm.raw && pm.raw['معرف الدفع']),
//       name: pm.name || (pm.raw && (pm.raw['طرق الدفع'] || pm.raw['طريقة الدفع'])),
//       raw: pm.raw || pm
//     }));

//     const stored = getLoggedPlace();
//     if (stored && stored.id) {
//       await tryPrefillPlaceForm(stored);
//       if (stored.id) {
//         await checkAdQuotaAndToggle(stored.id);
//         await loadAdsForPlace(stored.id);
//       }
//     }

//     updateAdsTabVisibility();
//   } catch (e) {
//     console.error('loadLookupsAndPopulate_error', e);
//   }
// }
// function populateSelect(selector, items, placeholder) {
//   const sel = document.querySelector(selector);
//   if (!sel) return;
//   sel.innerHTML = `<option value="">${placeholder}</option>`;
//   (items || []).forEach(it => {
//     const opt = document.createElement('option');
//     opt.value = it.id;
//     opt.textContent = it.name;
//     sel.appendChild(opt);
//   });
// }
// function setupCityAreaMap(areas) {
//   const map = {};
//   (areas || []).forEach(a => {
//     const cid = a.raw && (a.raw['ID المدينة'] || a.raw['cityId']);
//     if (!map[cid]) map[cid] = [];
//     map[cid].push({ id: a.id, name: a.name });
//   });
//   window.cityAreaMap = map;
// }
// function updateAreas() {
//   const citySel = document.getElementById('city');
//   const areaSel = document.getElementById('area');
//   if (!citySel || !areaSel) return;
//   areaSel.innerHTML = '<option value="">اختر المنطقة</option>';
//   const selected = citySel.value;
//   if (selected && window.cityAreaMap && window.cityAreaMap[selected]) {
//     window.cityAreaMap[selected].forEach(a => {
//       const opt = document.createElement('option');
//       opt.value = a.id;
//       opt.textContent = a.name;
//       areaSel.appendChild(opt);
//     });
//   }
// }

// // ============ إعدادات الباقات ====================
// function setupPackagesGrid(packages) {
//   const grid = document.getElementById('packagesGrid');
//   if (!grid) return;
//   grid.innerHTML = '';
//   const logged = getLoggedPlace();
//   const currentPkgId = logged && logged.raw ? String(logged.raw['الباقة']) : '';
//   const currentPkgStatus = logged && logged.raw ? String(logged.raw['حالة الباقة']).trim() : '';

//   (packages || []).forEach(pkg => {
//     const card = document.createElement('div');
//     card.classList.add('pkg-card');
//     card.textContent = `الباقة: ${pkg.name} • المدة: ${pkg.duration || ''} يوم • السعر: ${pkg.price || ''} • الإعلانات: ${pkg.allowedAds || ''}`;

//     if (currentPkgId && String(pkg.id) === currentPkgId) {
//       card.style.border = '2px solid #10b981';
//       card.style.boxShadow = '0 6px 18px rgba(16,185,129,0.15)';
//       const badge = document.createElement('div');
//       badge.textContent = 'باقتك الحالية';
//       badge.style.cssText = 'display: inline-block; background: #10b981; color: #fff; padding: 4px 8px; border-radius: 999px; margin-bottom: 8px; font-size: 12px; font-weight: 700;';
//       card.appendChild(badge);
//     }

//     const btn = document.createElement('button');
//     btn.classList.add('btn', 'choose-pkg');
//     if (currentPkgId && currentPkgStatus === 'نشطة') btn.textContent = 'هذه باقتك';
//     else if (currentPkgId && currentPkgStatus === 'قيد الدفع') btn.textContent = 'قيد الدفع';
//     else if (currentPkgId && currentPkgStatus === 'منتهية') btn.textContent = 'إعادة التفعيل';
//     else btn.textContent = 'اختر الباقة';

//     btn.onclick = async () => {
//       const logged = getLoggedPlace();
//       if (!logged || !logged.id) {
//         showError('احفظ بيانات المكان أولاً');
//         return;
//       }
//       if (pkg.price === 0) {
//         const blocked = await checkIfTrialIsUsed(logged.id);
//         if (blocked) {
//           showError('الباقة التجريبية غير متاحة مرة أخرى بعد انتهاء اشتراك سابق');
//           return;
//         }
//       }
//       await choosePackageAPI(pkg.id, { price: pkg.price });
//     };

//     card.appendChild(btn);
//     grid.appendChild(card);
//   });
// }

// async function checkIfTrialIsUsed(placeId) {
//   try {
//     const resp = await apiPost({ action: 'getDashboard', placeId });
//     const data = resp.data ? resp.data.data : resp.data;
//     const place = data && data.place ? data.place : null;
//     if (!place || !place.raw) return false;
//     const trialUsed = String(place.raw['حالة الباقة التجريبية']).toLowerCase() === 'true';
//     return trialUsed;
//   } catch { return false; }
// }

// // ============ إدارة الإعلانات ====================
// async function loadAdsForPlace(placeId) {
//   if (!placeId) return;
//   try {
//     const resp = await apiFetch(`${API_URL}?action=ads&placeId=${encodeURIComponent(placeId)}`);
//     if (!resp.ok) return;
//     const data = resp.data && resp.data.data ? resp.data.data : resp.data;
//     const ads = data.ads || [];
//     renderAdsList(ads);
//   } catch {}
// }
// function renderAdsList(ads) {
//   const container = document.getElementById('adsListContainer');
//   container.innerHTML = ads && ads.length ? '' : 'لا توجد إعلانات حالياً لهذا المحل.';
//   (ads || []).forEach(ad => {
//     const card = document.createElement('div');
//     card.classList.add('ad-card');
//     card.innerHTML = `
//       <h4>${ad.title || '(بدون عنوان)'}</h4>
//       <div class="meta">${ad.startDate || ''} — ${ad.endDate || ''} • الحالة: ${ad.status || ''}</div>
//       <p>${ad.description || ''}</p>
//     `;
//     if (ad.images && ad.images.length) {
//       const imgs = document.createElement('div');
//       imgs.classList.add('ad-images');
//       ad.images.forEach(img => {
//         const imgtag = document.createElement('img');
//         imgtag.src = img.url || img;
//         imgs.appendChild(imgtag);
//         card.appendChild(imgs);
//       });
//     }
//     const actions = document.createElement('div');
//     actions.classList.add('ad-actions');

//     const editBtn = document.createElement('button');
//     editBtn.classList.add('btn');
//     editBtn.textContent = 'تعديل';
//     editBtn.onclick = () => startEditAd(ad);
//     const delBtn = document.createElement('button');
//     delBtn.classList.add('btn', 'btn-secondary');
//     delBtn.textContent = 'حذف';
//     delBtn.onclick = () => deleteAdConfirm(ad.id);
//     actions.appendChild(editBtn);
//     actions.appendChild(delBtn);
//     card.appendChild(actions);
//     container.appendChild(card);
//   });
// }

// async function handleAdSubmit(ev) {
//   ev.preventDefault();
//   showLoading(true);
//   try {
//     const fd = new FormData(ev.target);
//     const formData = {
//       placeId: fd.get('placeId'), 
//       adType: fd.get('adType'),
//       adTitle: fd.get('adTitle'),
//       coupon: fd.get('coupon'),
//       adDescription: fd.get('adDescription'),
//       startDate: fd.get('startDate'),
//       endDate: fd.get('endDate'),
//       adActiveStatus: fd.get('adActiveStatus'),
//       images: [],
//       video: null
//     };

//     if (!validateFiles()) {
//       showLoading(false);
//       return;
//     }

//     // تحميل الصور
//     const fileInputs = document.getElementById('adImages');
//     if (fileInputs && fileInputs.files) {
//       const imageUrls = [];
//       for (let i = 0; i < Math.min(fileInputs.files.length, 8); i++) {
//         const file = fileInputs.files[i];
//         const url = await uploadToGoogleDrive(file, 'ads');
//         imageUrls.push({ name: file.name, url });
//         recentUploads[file.name] = { url, name: file.name };
//       }
//       formData.images = imageUrls;
//     }

//     // تحميل الفيديو
//     const videoInput = document.getElementById('adVideo');
//     if (videoInput && videoInput.files) {
//       const video = videoInput.files[0];
//       const videoUrl = await uploadToGoogleDrive(video, 'ads');
//       formData.video = videoUrl || '';
//     }

//     const logged = getLoggedPlace();
//     const placeIdToSend = (formData.placeId && formData.placeId !== '') ? formData.placeId : (logged && logged.id ? logged.id : '');

//     const payload = {
//       action: editingAdId ? 'updateAd' : 'addAd',
//       placeId: placeIdToSend,
//       adType: formData.adType,
//       adTitle: formData.adTitle,
//       adDescription: formData.adDescription,
//       startDate: formData.startDate,
//       endDate: formData.endDate,
//       coupon: formData.coupon,
//       images: JSON.stringify(formData.images.map(i => i.name)),
//       imageUrls: JSON.stringify(formData.images.map(i => i.url)),
//       videoFile: formData.video ? formData.video.name : '',
//       videoUrl: formData.video,
//       adStatus: formData.adStatus
//     };

//     if (editingAdId) payload.adId = editingAdId;

//     const resp = await apiPost(payload);
//     if (!resp.ok || (resp.data && resp.data.success === false)) {
//       showError((resp.data && resp.data.error) || 'فشل حفظ/تحديث الإعلان');
//       return;
//     }

//     showSuccess(editingAdId ? 'تم تحديث الإعلان' : 'تم حفظ الإعلان');
  
//   const areaValue = areaOptions.find(Boolean);
//   if (areaValue) {
//     await setSelectValueWhenReady('select[name="area"]', areaValue);
//   }
// }

// function parseLatLngFromMapLink(url) {
//   if (!url || typeof url !== 'string') return null;
  
//   try {
//     url = url.trim();
    
//     // نماذج مختلفة لروابط الخرائط
//     const patterns = [
//       /@(-?\d+\.\d+),\s*(-?\d+\.\d+)/,
//       /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/,
//       /[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/,
//       /[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/,
//       /[?&]mlat=(-?\d+\.\d+)&mlon=(-?\d+\.\d+)/,
//       /#map=\d+\/(-?\d+\.\d+)\/(-?\d+\.\d+)/,
//       /(-?\d+\.\d+)[, ]\s*(-?\d+\.\d+)/
//     ];
    
//     for (const pattern of patterns) {
//       const match = url.match(pattern);
//       if (match) {
//         const lat = parseFloat(match[1]);
//         const lng = parseFloat(match[2]);
        
//         if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
//           return { lat, lng };
//         }
//       }
//     }
//   } catch (e) {
//     console.warn('parseLatLngFromMapLink error', e);
//   }
  
//   return null;
// }

// /* ========================= نافذة الدفع ========================= */
// function showPaymentModal({ paymentId, amount, currency, placeId }) {
//   // إزالة النافذة السابقة إن وجدت
//   const existing = document.getElementById('paymentModal');
//   if (existing) existing.remove();

//   const modal = document.createElement('div');
//   modal.id = 'paymentModal';
//   modal.style.cssText = `
//     position: fixed;
//     inset: 0;
//     background: rgba(0,0,0,0.5);
//     display: flex;
//     align-items: center;
//     justify-content: center;
//     z-index: 9999;
//   `;

//   modal.innerHTML = `
//     <div style="background:#fff;padding:18px;border-radius:10px;max-width:720px;width:95%;direction:rtl;color:#111">
//       <h3 style="margin-top:0">معلومات الدفع</h3>
//       ${paymentId ? `<p>معرف طلب الدفع: <strong>${escapeHtml(paymentId)}</strong></p>` : '<p>لا يوجد معرف طلب دفع متاح حالياً.</p>'}
//       ${amount ? `<p>المبلغ المطلوب: <strong>${escapeHtml(String(amount))} ${escapeHtml(String(currency || 'SAR'))}</strong></p>` : ''}
//       <h4>طرق الدفع المتاحة</h4>
//       <div id="paymentMethods" style="margin-bottom:8px"></div>
//       <label style="display:block;margin-top:8px">ارفق إيصال الدفع (صورة)</label>
//       <input type="file" id="paymentReceipt" accept="image/*" style="display:block;margin:8px 0" />
//       <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px">
//         <button id="paymentCancel" class="btn btn-secondary">إلغاء</button>
//         <button id="paymentSend" class="btn btn-primary">أرسل الإيصال</button>
//       </div>
//       <div id="paymentMessage" style="margin-top:10px;color:#333"></div>
//     </div>
//   `;

//   document.body.appendChild(modal);

//   // ملء طرق الدفع
//   const methodsContainer = modal.querySelector('#paymentMethods');
//   const methods = window.availablePaymentMethods || [];
  
//   if (methods && methods.length) {
//     methods.forEach(method => {
//       const div = document.createElement('div');
//       div.style.cssText = 'padding:8px;border-radius:6px;border:1px solid #eee;margin-bottom:6px;background:#fafafa';
      
//       const name = method.name || (method.raw && (method.raw['طرق الدفع'] || method.raw['طريقة الدفع'])) || 'طريقة دفع';
//       const details = (method.raw && (method.raw['معرف الدفع'] || method.id)) ? (method.raw['معرف الدفع'] || method.id) : '';
      
//       div.innerHTML = `
//         <strong style="display:block">${escapeHtml(name)}</strong>
//         ${details ? `<div style="color:#666;margin-top:4px">تفاصيل: ${escapeHtml(String(details))}</div>` : ''}
//       `;
//       methodsContainer.appendChild(div);
//     });
//   } else {
//     methodsContainer.textContent = 'لا توجد طرق دفع معرفة. تواصل مع الإدارة.';
//   }

//   // ربط الأحداث
//   const fileInput = modal.querySelector('#paymentReceipt');
//   const cancelBtn = modal.querySelector('#paymentCancel');
//   const sendBtn = modal.querySelector('#paymentSend');
//   const messageDiv = modal.querySelector('#paymentMessage');

//   cancelBtn.addEventListener('click', () => modal.remove());

//   sendBtn.addEventListener('click', async () => {
//     if (!fileInput.files || fileInput.files.length === 0) {
//       messageDiv.textContent = 'الرجاء اختيار صورة الإيصال أولاً';
//       return;
//     }

//     sendBtn.disabled = true;
//     sendBtn.textContent = 'جاري الرفع...';
//     messageDiv.textContent = '';

//     try {
//       const file = fileInput.files;
//       const base64 = await readFileAsBase64(file);

//       // رفع الملف
//       const uploadResp = await apiPost({
//         action: 'uploadMedia',
//         fileName: file.name,
//         mimeType: file.type,
//         fileData: base64,
//         placeId: placeId || ''
//       });

//       if (!uploadResp.ok) {
//         throw new Error('فشل رفع الملف');
//       }

//       const uploadData = uploadResp.data.data || uploadResp.data;
//       const fileUrl = (uploadData && (uploadData.fileUrl || uploadData.url)) || '';

//       if (!fileUrl) {
//         throw new Error('لم يتم الحصول على رابط الملف بعد الرفع');
//       }

//       // تحديث طلب الدفع
//       if (paymentId) {
//         const updateResp = await apiPost({
//           action: 'updatePaymentRequest',
//           paymentId: paymentId,
//           updates: {
//             'رابط إيصال الدفع': fileUrl,
//             receiptUrl: fileUrl,
//             الحالة: 'receipt_uploaded',
//             ملاحظات: 'تم رفع إيصال من صاحب المحل'
//           }
//         });

//         if (!updateResp.ok) {
//           throw new Error('تم رفع الإيصال لكن فشل ربطه بطلب الدفع');
//         }
//       }

//       messageDiv.textContent = 'تم إرسال الإيصال بنجاح. سيتم مراجعته والرد عليك قريباً.';
//       setTimeout(() => modal.remove(), 2000);

//     } catch (err) {
//       messageDiv.textContent = 'حدث خطأ أثناء الإرسال: ' + (err.message || err);
//       sendBtn.disabled = false;
//       sendBtn.textContent = 'أرسل الإيصال';
//     }
//   });
// }

// /* ========================= شريط حالة المكان ========================= */
// function showPlaceStatusBar(place) {
//   const statusBar = document.getElementById('placeStatusBar');
//   const statusMessage = document.getElementById('placeStatusMessage');
  
//   if (!statusBar) return;
  
//   if (!place || !place.id) {
//     statusBar.style.display = 'none';
//     if (statusMessage) statusMessage.textContent = '';
//     return;
//   }
  
//   statusBar.style.display = 'block';
  
//   const currentStatus = (place.status && String(place.status).trim() !== '') 
//     ? place.status 
//     : (place.raw && (place.raw['حالة المكان'] || place.raw['حالة التسجيل'])) 
//       ? (place.raw['حالة المكان'] || place.raw['حالة التسجيل']) 
//       : '';
  
//   const buttons = document.querySelectorAll('#placeStatusButtons .status-btn');
//   buttons.forEach(button => {
//     button.classList.toggle('active', button.dataset.status === currentStatus);
//     button.disabled = false;
//     button.textContent = button.dataset.status;
//   });
  
//   if (statusMessage) {
//     statusMessage.textContent = currentStatus ? `الحالة الحالية: ${currentStatus}` : 'الحالة غير محددة';
//   }
  
//   initPlaceStatusButtons();
// }

// function hidePlaceStatusBar() {
//   const statusBar = document.getElementById('placeStatusBar');
//   const statusMessage = document.getElementById('placeStatusMessage');
  
//   if (statusBar) statusBar.style.display = 'none';
//   if (statusMessage) statusMessage.textContent = '';
// }

// function initPlaceStatusButtons() {
//   const container = document.getElementById('placeStatusButtons');
//   if (!container) return;
  
//   // إعادة إنشاء مستمعي الأحداث
//   container.querySelectorAll('.status-btn').forEach(button => {
//     const clone = button.cloneNode(true);
//     button.parentNode.replaceChild(clone, button);
//   });
  
//   const buttons = document.querySelectorAll('#placeStatusButtons .status-btn');
//   buttons.forEach(button => {
//     button.addEventListener('click', async () => {
//       const status = button.dataset.status;
//       if (!status) return;
//       await updatePlaceStatus(status, button);
//     });
//   });
// }

// async function updatePlaceStatus(newStatus, buttonElement = null) {
//   let originalText = null;
  
//   try {
//     const logged = getLoggedPlace();
//     const placeId = (logged && logged.id) ? logged.id : null;
    
//     if (!placeId) {
//       throw new Error('لا يوجد مكان مسجّل للدخول');
//     }

//     const currentStatus = (logged && logged.status) 
//       ? logged.status 
//       : (logged && logged.raw && (logged.raw['حالة المكان'] || logged.raw['حالة التسجيل'])) 
//         ? (logged.raw['حالة المكان'] || logged.raw['حالة التسجيل']) 
//         : '';

//     // إذا كانت الحالة نفسها، لا حاجة للتحديث
//     if (String(currentStatus) === String(newStatus)) {
//       document.querySelectorAll('#placeStatusButtons .status-btn').forEach(button => {
//         button.classList.toggle('active', button.dataset.status === newStatus);
//       });
      
//       const statusMessage = document.getElementById('placeStatusMessage');
//       if (statusMessage) statusMessage.textContent = `الحالة: ${newStatus}`;
//       return;
//     }

//     // تعطيل كل الأزرار أثناء التحديث
//     const buttons = document.querySelectorAll('#placeStatusButtons .status-btn');
//     buttons.forEach(button => button.disabled = true);

//     if (buttonElement) {
//       originalText = buttonElement.textContent;
//       buttonElement.textContent = 'جاري الحفظ...';
//     }

//     // إرسال التحديث للخادم
//     const resp = await apiPost({
//       action: 'updatePlace',
//       placeId: placeId,
//       status: newStatus
//     });

//     if (!resp.ok) {
//       throw new Error('فشل في التواصل مع الخادم');
//     }

//     const data = resp.data;
//     if (!data || data.success === false) {
//       throw new Error((data && data.error) ? data.error : 'استجابة غير متوقعة');
//     }

//     // تحديث البيانات المحلية
//     const stored = getLoggedPlace() || {};
//     stored.status = newStatus;
//     if (!stored.raw) stored.raw = {};
//     stored.raw['حالة المكان'] = newStatus;
//     stored.raw['حالة التسجيل'] = newStatus;
//     setLoggedPlace(stored);

//     // تحديث واجهة الأزرار
//     buttons.forEach(button => {
//       button.classList.toggle('active', button.dataset.status === newStatus);
//       button.disabled = false;
//       button.textContent = button.dataset.status;
//     });

//     if (buttonElement && originalText !== null) {
//       buttonElement.textContent = buttonElement.dataset.status;
//     }

//     const statusMessage = document.getElementById('placeStatusMessage');
//     if (statusMessage) {
//       statusMessage.textContent = `تم التحديث إلى: ${newStatus}`;
//     }

//     showSuccess('تم تحديث حالة المكان بنجاح');

//   } catch (err) {
//     console.error('updatePlaceStatus error', err);
//     showError(err.message || 'فشل تحديث حالة المكان');
    
//     // استعادة الأزرار
//     document.querySelectorAll('#placeStatusButtons .status-btn').forEach(button => {
//       button.disabled = false;
//       button.textContent = button.dataset.status;
//     });
    
//     if (buttonElement && originalText !== null) {
//       buttonElement.textContent = originalText;
//     }
//   }
// }

// /* ========================= مساعدات متنوعة ========================= */
// function showTab(tabName) {
//   // إخفاء كل المحتويات
//   document.querySelectorAll('.tab-content').forEach(content => {
//     content.style.display = 'none';
//   });
  
//   // إزالة الفئة النشطة من كل التبويبات
//   document.querySelectorAll('.tab').forEach(tab => {
//     tab.classList.remove('active');
//   });
  
//   // عرض المحتوى المطلوب
//   const targetContent = document.getElementById(tabName + '-tab');
//   if (targetContent) {
//     targetContent.style.display = 'block';
//   }
  
//   // تفعيل التبويب
//   const targetTab = document.getElementById('tab-' + tabName);
//   if (targetTab) {
//     targetTab.classList.add('active');
//   }
  
//   currentTab = tabName;
// }

// function clearImagePreview() {
//   const preview = document.getElementById('placeImagePreview');
//   if (preview) preview.innerHTML = '';
//   uploadedImages = [];
// }

// function clearAdForm(form) {
//   form.reset();
  
//   const imagePreview = document.getElementById('adImagesPreview');
//   const videoPreview = document.getElementById('adVideoPreview');
  
//   if (imagePreview) imagePreview.innerHTML = '';
//   if (videoPreview) videoPreview.innerHTML = '';
  
//   uploadedImages = [];
//   uploadedVideos = [];
// }

// function startEditAd(ad) {
//   try {
//     editingAdId = ad.id || null;
//     const form = document.getElementById('adForm');
//     if (!form) return;

//     // ملء البيانات الأساسية
//     const fieldMap = {
//       'select[name="placeId"]': ad.placeId || '',
//       'select[name="adType"]': ad.type || '',
//       'input[name="adTitle"]': ad.title || '',
//       'input[name="coupon"]': ad.coupon || '',
//       'textarea[name="adDescription"]': ad.description || '',
//       'input[name="startDate"]': ad.startDate || '',
//       'input[name="endDate"]': ad.endDate || '',
//       'select[name="adActiveStatus"]': ad.adActiveStatus || ad.status || '',
//       'select[name="adStatus"]': ad.adStatus || ad.status || ''
//     };

//     for (const [selector, value] of Object.entries(fieldMap)) {
//       const element = form.querySelector(selector);
//       if (element) element.value = value;
//     }

//     // معاينة الصور
//     const imagePreview = document.getElementById('adImagesPreview');
//     if (imagePreview) {
//       imagePreview.innerHTML = '';
      
//       if (ad.images && ad.images.length) {
//         const imagesArray = Array.isArray(ad.images) ? ad.images : 
//           (typeof ad.images === 'string' ? JSON.parse(ad.images) : []);
        
//         imagesArray.forEach(image => {
//           const url = image && image.url ? image.url : (typeof image === 'string' ? image : '');
//           const name = image && image.name ? image.name : (typeof image === 'string' ? image : '');
          
//           const container = document.createElement('div');
//           container.className = 'preview-image';
          
//           if (url) {
//             const img = document.createElement('img');
//             img.src = url;
//             img.style.cssText = 'width:100%;height:90px;object-fit:cover';
//             container.appendChild(img);
//           } else if (name && recentUploads[name]) {
//             const img = document.createElement('img');
//             img.src = recentUploads[name].url;
//             img.style.cssText = 'width:100%;height:90px;object-fit:cover';
//             container.appendChild(img);
//           } else if (name) {
//             const placeholder = document.createElement('div');
//             placeholder.className = 'img-placeholder-file';
//             placeholder.textContent = name;
//             container.appendChild(placeholder);
//           }
          
//           imagePreview.appendChild(container);
//         });
//       }
//     }

//     // معاينة الفيديو
//     const videoPreview = document.getElementById('adVideoPreview');
//     if (videoPreview) {
//       videoPreview.innerHTML = '';
      
//       if (ad.videoUrl) {
//         const video = document.createElement('video');
//         video.src = ad.videoUrl;
//         video.controls = true;
//         video.style.width = '100%';
//         videoPreview.appendChild(video);
//       }
//     }

//     // تغيير نص الزر
//     const submitBtn = document.querySelector('#adForm button[type="submit"]');
//     if (submitBtn) submitBtn.textContent = 'تحديث الإعلان';
    
//     // الانتقال لتبويب الإعلانات
//     showTab('ads');
    
//   } catch (e) {
//     console.error('startEditAd failed', e);
//   }
// }

// async function tryPrefillPlaceForm(place) {
//   if (!place || !place.raw) return;
  
//   try {
//     const raw = place.raw;
    
//     // دالة مساعدة لملء الحقول
//     const setInput = (selector, value) => {
//       const element = document.querySelector(selector);
//       if (element && value !== undefined && value !== null) {
//         element.value = value;
//       }
//     };

//     // ملء البيانات الأساسية
//     const name = raw['اسم المكان'] || place.name || '';
//     setInput('input[name="placeName"]', name);
//     setInput('input[name="password"]', raw['كلمة المرور'] || place.password || '');
//     set




































































/* =========================
   script.js
   ضع هنا رابط Web App (ناتج نشر code.gs) في API_URL
   ========================= */
const API_URL = 'https://script.google.com/macros/s/AKfycbwB0VE5COC0e6NQNKrxQeNRu2Mtt_QuMbVoBrH7tE6Da3X3BP6UxK926bt9fDO0WPU5/exec'; // <-- غيّر هذا إلى رابط Web App

// حالة التطبيق وذاكرة مؤقتة خفيفة
let currentPlace = null;     // كائن المكان المسجل في localStorage
let uploadedImages = [];     // ملفات صور للإعلانات (File objects)
let uploadedVideo = null;    // ملف فيديو (File)
let lastLookups = null;      // يحتوي على packages, cities, areas, activities,...

/* ------------------------- DOM shortcuts ------------------------- */
const $ = id => document.getElementById(id);
const showLoading = (v) => { $('loading').style.display = v ? 'flex' : 'none'; };
const showSuccess = (msg) => { const el=$('successAlert'); el.textContent=msg; el.style.display='block'; setTimeout(()=>el.style.display='none',4000); };
const showError = (msg) => { const el=$('errorAlert'); el.textContent=msg; el.style.display='block'; setTimeout(()=>el.style.display='none',6000); };

/* ------------------------- Initialization ------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  bindUI();
  initTheme();
  loadLookupsAndPopulate();
  loadLocalPlace();
});

/* ------------------------- UI Bindings ------------------------- */
function bindUI() {
  // tabs
  window.showTab = (name) => {
    ['places','ads','packages'].forEach(t => {
      const btn = $('tab-btn-'+t);
      const panel = $('tab-'+t);
      if (btn) btn.classList.toggle('active', t===name);
      if (panel) panel.classList.toggle('active', t===name);
    });
  };

  // place form
  $('placeForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await savePlace();
  });
  $('btn-to-packages').addEventListener('click', ()=> showTab('packages'));

  // login UI
  $('loginBtn').addEventListener('click', ()=> $('loginModal').style.display='flex');
  $('loginCancel').addEventListener('click', ()=> $('loginModal').style.display='none');
  $('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleLogin();
  });
  $('logoutBtn').addEventListener('click', () => { logoutLocal(); showSuccess('تم تسجيل الخروج'); });

  // ad form
  $('adForm').addEventListener('submit', async (e)=>{ e.preventDefault(); await saveAd(); });
  $('adImages').addEventListener('change', (ev) => previewMultipleImages(ev.target.files, 'adImagesPreview'));
  $('adVideo').addEventListener('change', (ev) => previewVideo(ev.target.files[0], 'adVideoPreview'));

  // place image preview
  $('placeImage').addEventListener('change', (ev) => previewSingleImage(ev.target.files[0], 'placeImagePreview'));

  // status buttons
  document.querySelectorAll('#placeStatusButtons .status-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const s = btn.dataset.status;
      await updatePlaceStatus(s);
    });
  });

  // packages grid click handler will be added during render
}

/* ------------------------- Theme ------------------------- */
function initTheme(){
  try {
    const t = localStorage.getItem('khedmatak_theme') || 'light';
    if (t==='dark') document.body.classList.add('dark');
  } catch(e){}
  const themeBtn = document.querySelector('#themeToggleBtn');
  if (themeBtn) themeBtn.addEventListener('click', toggleTheme);
}
function toggleTheme(){
  document.body.classList.toggle('dark');
  try{ localStorage.setItem('khedmatak_theme', document.body.classList.contains('dark') ? 'dark' : 'light'); }catch{}
}

/* ========================= API helpers ========================= */
async function apiGet(action, params = {}) {
  try {
    const url = new URL(API_URL);
    url.searchParams.set('action', action);
    Object.keys(params).forEach(k => url.searchParams.set(k, params[k]));
    const res = await fetch(url.toString());
    const text = await res.text();
    try { return JSON.parse(text); } catch { return text; }
  } catch (e) { throw e; }
}

async function apiPostForm(formData) {
  try {
    const res = await fetch(API_URL, { method: 'POST', body: formData });
    const text = await res.text();
    try { return JSON.parse(text); } catch { return text; }
  } catch (e) { throw e; }
}

/* read file to base64 (no data: prefix) */
function fileToBase64(file){
  return new Promise((resolve,reject)=>{
    const fr = new FileReader();
    fr.onload = ()=> {
      const s = fr.result || '';
      const idx = s.indexOf(',');
      resolve(idx>=0 ? s.substring(idx+1) : s);
    };
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
}

/* ========================= Lookups & initial populate ========================= */
async function loadLookupsAndPopulate(){
  try{
    showLoading(true);
    const resp = await apiGet('getLookups');
    const data = (resp && resp.success && resp.data) ? resp.data : resp;
    lastLookups = data;
    populateSelect('activityType', data.activities || []);
    populateSelect('city', data.cities || []);
    populateSelect('location', data.sites || []);
    renderPackagesGrid(data.packages || []);
    populatePlacesSelects();
    // areas depend on city; build map
    buildCityAreaMap(data.areas || []);
    // try prefill if logged
    if (currentPlace) prefillPlaceForm(currentPlace);
  }catch(err){
    console.error(err);
    showError('تعذر جلب بيانات التعريف (lookups)');
  }finally{ showLoading(false); }
}

function populateSelect(id, items){
  const sel = $(id);
  if (!sel) return;
  sel.innerHTML = '<option value="">اختر</option>';
  items.forEach(it=>{
    const o = document.createElement('option');
    o.value = it.id || it.raw && (it.raw['ID'] || it.raw['ID الباقة']) || '';
    o.textContent = it.name || (it.raw && (it.raw['اسم المدينة'] || it.raw['اسم الباقة'])) || o.value;
    sel.appendChild(o);
  });
}

/* ----------------- cities -> areas map ----------------- */
let cityAreaMap = {};
function buildCityAreaMap(areas){
  cityAreaMap = {};
  (areas || []).forEach(a=>{
    const cid = (a.raw && (a.raw['ID المدينة'] || a.raw.cityId)) || a.id || '';
    if (!cityAreaMap[cid]) cityAreaMap[cid] = [];
    cityAreaMap[cid].push(a);
  });
}
function updateAreas(){
  const city = $('city').value;
  const areaSel = $('area');
  areaSel.innerHTML = '<option value="">اختر</option>';
  if (city && cityAreaMap[city]) cityAreaMap[city].forEach(a=>{
    const o = document.createElement('option'); o.value = a.id; o.textContent = a.name; areaSel.appendChild(o);
  });
}

/* ========================= Places (register/update/login) ========================= */
async function savePlace(){
  try{
    showLoading(true);
    const form = $('placeForm');
    const formData = new FormData();
    const logged = loadLocalPlaceFromStorage();
    const isUpdate = !!(logged && logged.id);

    // gather values
    const payload = {
      name: form.placeName.value || '',
      password: form.password.value || '',
      activityId: form.activityType.value || '',
      cityId: form.city.value || '',
      areaId: form.area.value || '',
      siteId: form.location.value || '',
      address: form.detailedAddress.value || '',
      mapLink: form.mapLink ? form.mapLink.value : '',
      phone: form.phone.value || '',
      whatsapp: form.whatsappLink.value || '',
      email: form.email.value || '',
      website: form.website.value || '',
      hours: form.workingHours.value || '',
      delivery: form.delivery.value || '',
      description: form.description.value || ''
    };

    // if image chosen, upload first
    const imageFile = $('placeImage').files && $('placeImage').files[0];
    if (imageFile){
      const uploaded = await uploadFileToServer(imageFile, logged && logged.id ? logged.id : '');
      if (uploaded && (uploaded.fileUrl || uploaded.url)) {
        payload.logoUrl = uploaded.fileUrl || uploaded.url;
        payload.imgbbLogoUrl = uploaded.imgbbUrl || '';
      }
    }

    const post = new FormData();
    post.append('action', isUpdate ? 'updatePlace' : 'registerPlace');
    // if updating attach placeId
    if (isUpdate) post.append('placeId', String(logged.id));
    // append payload fields
    Object.keys(payload).forEach(k => {
      if (payload[k] !== undefined && payload[k] !== null) post.append(k, payload[k]);
    });

    const resp = await apiPostForm(post);
    const ok = resp && (resp.success === true || (resp.data && resp.data.message));
    if (!ok) {
      const err = resp && (resp.error || (resp.data && resp.data.error)) || 'فشل الحفظ';
      throw new Error(err);
    }

    // if register: resp.data.id may contain new id
    let newPlace = null;
    if (resp.data && resp.data.place) newPlace = resp.data.place;
    else if (resp.data && resp.data.id) {
      // fetch dashboard to get full place
      const dash = await apiPostForm(Object.assign(new FormData(), Object.entries([['action','getDashboard'],['placeId',String(resp.data.id)]]).reduce((fd,[k,v])=>{fd.append(k,v);return fd}, new FormData())));
      // try to extract
      if (dash && dash.data && dash.data.place) newPlace = dash.data.place;
    }

    if (!newPlace) {
      // best-effort: build minimal object
      const built = { id: (resp.data && resp.data.id) || (logged && logged.id) || '', raw: {} };
      Object.keys(payload).forEach(k => {
        // map some keys to Arabic header fields
        if (k==='name') built.raw['اسم المكان'] = payload[k];
        if (k==='phone') built.raw['رقم التواصل'] = payload[k];
        if (k==='logoUrl') built.raw['صورة شعار أو صورة المكان'] = payload[k];
      });
      newPlace = built;
    }

    saveLocalPlace(newPlace);
    setUIAfterLogin(newPlace);
    showSuccess('تم حفظ بيانات المكان بنجاح');
    // refresh lookups & packages bar
    await refreshSubscriptionBar();
    await populatePlacesSelects();
    if (newPlace.id) await checkAdQuotaAndToggle(newPlace.id);
  }catch(err){
    console.error(err);
    showError(err.message || err || 'خطأ أثناء حفظ المكان');
  }finally{ showLoading(false); }
}

async function handleLogin(){
  try{
    showLoading(true);
    const phoneOrId = $('phoneOrId').value.trim();
    const password = $('loginPassword').value || '';
    if (!phoneOrId || !password) { showError('أدخل رقم/ID وكلمة المرور'); return; }

    const post = new FormData();
    post.append('action','loginPlace');
    post.append('phoneOrId', phoneOrId);
    post.append('password', password);

    const resp = await apiPostForm(post);
    if (!resp || resp.success === false) {
      const err = resp && (resp.error || (resp.data && resp.data.error)) || 'فشل تسجيل الدخول';
      throw new Error(err);
    }
    const place = (resp.data && resp.data.place) ? resp.data.place : (resp.data || resp);
    if (!place) throw new Error('تعذر استلام بيانات المكان من الخادم');

    saveLocalPlace(place);
    setUIAfterLogin(place);
    $('loginModal').style.display = 'none';
    showSuccess('تم تسجيل الدخول');
    await populatePlacesSelects();
    await refreshSubscriptionBar();
  }catch(err){
    console.error(err);
    showError(err.message || 'خطأ أثناء تسجيل الدخول');
  }finally{ showLoading(false); }
}

function saveLocalPlace(placeObj){
  try{ localStorage.setItem('khedmatak_place', JSON.stringify(placeObj)); currentPlace = placeObj; }catch(e){}
}
function loadLocalPlaceFromStorage(){
  try{ const raw = localStorage.getItem('khedmatak_place'); return raw ? JSON.parse(raw) : null; }catch(e){return null;}
}
function loadLocalPlace(){ currentPlace = loadLocalPlaceFromStorage(); if (currentPlace) setUIAfterLogin(currentPlace); else setUILoggedOut(); }

/* ------------------ UI After login/out ------------------ */
function setUIAfterLogin(place){
  currentPlace = place;
  try{ $('placeNameBanner').style.display = 'inline-block'; $('placeNameBanner').textContent = place.name || (place.raw && place.raw['اسم المكان']) || ('مكان #' + (place.id||'')); }catch(e){}
  $('loginBtn').style.display = 'none';
  $('logoutBtn').style.display = 'inline-block';
  $('tab-btn-ads').style.display = 'inline-block';
  prefillPlaceForm(place);
  showPlaceStatusBar(place);
}
function setUILoggedOut(){
  $('placeNameBanner').style.display = 'none';
  $('loginBtn').style.display = 'inline-block';
  $('logoutBtn').style.display = 'none';
  $('tab-btn-ads').style.display = 'none';
  hidePlaceStatusBar();
  $('subscriptionStatusBar').style.display = 'none';
}

/* ------------------ logout ------------------ */
function logoutLocal(){
  localStorage.removeItem('khedmatak_place');
  currentPlace = null;
  setUILoggedOut();
}

/* ------------------ Pre-fill place form ------------------ */
function prefillPlaceForm(place){
  if (!place || !place.raw) return;
  const raw = place.raw;
  $('placeName').value = raw['اسم المكان'] || place.name || '';
  if (raw['رقم التواصل']) $('phone').value = raw['رقم التواصل'];
  if (raw['البريد الإلكتروني']) $('email').value = raw['البريد الإلكتروني'];
  if (raw['الموقع الالكتروني']) $('website').value = raw['الموقع الالكتروني'];
  if (raw['العنوان التفصيلي']) $('detailedAddress').value = raw['العنوان التفصيلي'];
  setSelectValueByText($('activityType'), raw['نوع النشاط / الفئة'] || raw['نوع النشاط'] || '');
  setSelectValueByText($('city'), raw['المدينة'] || '');
  updateAreas();
  setSelectValueByText($('area'), raw['المنطقة'] || '');
  setSelectValueByText($('location'), raw['الموقع او المول'] || '');
  if (raw['صورة شعار أو صورة المكان'] || raw['رابط صورة شعار المكان']){
    const url = raw['رابط صورة شعار المكان'] || raw['صورة شعار أو صورة المكان'];
    const p = $('placeImagePreview'); p.innerHTML = ''; const img = document.createElement('img'); img.src = url; p.appendChild(img);
  }
}

/* helper set select by visible text/value */
function setSelectValueByText(sel, text){
  if (!sel || !text) return;
  for (const o of Array.from(sel.options)){
    if (o.value === text || (o.text && o.text.trim() === text) || (o.text && o.text.includes(text))) { sel.value = o.value; break; }
  }
}

/* ========================= Packages ========================= */
function renderPackagesGrid(pkgs){
  const grid = $('packagesGrid'); if (!grid) return;
  grid.innerHTML = '';
  (pkgs || []).forEach(p=>{
    const duration = Number(p.duration || (p.raw && (p.raw['مدة الباقة باليوم']||p.raw['مدة'])) || 0);
    const price = Number(p.price || (p.raw && (p.raw['سعر الباقة']||p.raw['السعر'])) || 0);
    const allowed = Number(p.allowedAds || (p.raw && (p.raw['عدد الاعلانات']||p.raw['عدد_الاعلانات'])) || 0);

    const div = document.createElement('div'); div.className='pkg';
    div.innerHTML = `<div style="font-weight:700;margin-bottom:8px">${escapeHtml(p.name||'باقة')}</div>
      <div class="small">المدة: ${duration} يوم • السعر: ${price} • الاعلانات: ${allowed}</div>
      <div style="margin-top:10px">${p.raw && (p.raw['وصف الباقة']||p.raw['description']||'')}</div>`;
    const btn = document.createElement('button'); btn.className='btn'; btn.style.marginTop='12px';
    btn.textContent = price===0 ? 'تفعيل فوري' : 'اختيار باقة';
    btn.addEventListener('click', ()=> choosePackage(p.id, price));
    div.appendChild(btn);
    grid.appendChild(div);
  });
}

async function choosePackage(packageId, price){
  if (!currentPlace || !currentPlace.id) { showError('سجل الدخول أو احفظ المكان أولاً'); return; }
  try{
    showLoading(true);
    const fd = new FormData();
    fd.append('action','choosePackage');
    fd.append('placeId', String(currentPlace.id));
    fd.append('packageId', String(packageId));
    const resp = await apiPostForm(fd);
    if (!resp || (resp.success===false)) throw new Error(resp && (resp.error || (resp.data && resp.data.error)) || 'خطأ');
    const result = resp.data || resp;
    // code.gs returns { success:true, pending:true/false, paymentId, ... } or { success:true, pending:false, start,end,... }
    if (result.pending) {
      showSuccess('تم إنشاء طلب دفع. ارفق إيصال الدفع من لوحة الإدارة.');
      // update local copy
      if (!currentPlace.raw) currentPlace.raw = {};
      currentPlace.raw['الباقة'] = String(packageId);
      currentPlace.raw['حالة الباقة'] = 'قيد الدفع';
      saveLocalPlace(currentPlace);
      await refreshSubscriptionBar();
    } else {
      showSuccess('تم تفعيل الباقة بنجاح');
      if (!currentPlace.raw) currentPlace.raw = {};
      currentPlace.raw['الباقة'] = String(packageId);
      currentPlace.raw['حالة الباقة'] = 'نشطة';
      currentPlace.raw['تاريخ بداية الاشتراك'] = result.start || currentPlace.raw['تاريخ بداية الاشتراك'];
      currentPlace.raw['تاريخ نهاية الاشتراك'] = result.end || currentPlace.raw['تاريخ نهاية الاشتراك'];
      saveLocalPlace(currentPlace);
      await refreshSubscriptionBar();
    }
  }catch(err){
    console.error(err); showError(err.message || 'خطأ أثناء اختيار الباقة');
  }finally{ showLoading(false); }
}

/* ========================= Upload helper ========================= */
async function uploadFileToServer(file, placeId=''){
  // converts file to base64 and calls action 'uploadMedia' (code.gs supports it)
  try{
    const base64 = await fileToBase64(file);
    const fd = new FormData();
    fd.append('action','uploadMedia');
    fd.append('placeId', placeId || '');
    fd.append('fileName', file.name);
    fd.append('mimeType', file.type || 'application/octet-stream');
    fd.append('fileData', base64);
    // optional: imgbb flag if you want to attempt imgBB: fd.append('imgbb','true')
    const resp = await apiPostForm(fd);
    // resp may be { success:true, data: { fileUrl, fileId, imgbbUrl, ... } }
    if (resp && resp.success && resp.data) return resp.data;
    return resp;
  }catch(err){ console.error(err); throw err; }
}

/* ========================= Ads (add / list / update / delete) ========================= */
async function populatePlacesSelects(){
  // use GET action places -> code.gs has 'places' in GET (returns success:true,data:{places: [...]}) in some branches
  try{
    const resp = await apiGet('places');
    let list = [];
    if (resp && resp.success && resp.data && Array.isArray(resp.data.places)) list = resp.data.places;
    else if (Array.isArray(resp)) list = resp;
    else if (resp && Array.isArray(resp.places)) list = resp.places;

    // fill both adPlaces and place selection
    const selAd = $('adPlaceId'); selAd.innerHTML = '<option value="">اختر</option>';
    list.forEach(p=>{
      const opt = document.createElement('option'); opt.value = p.id; opt.textContent = p.name || (p.raw&&p.raw['اسم المكان']) || p.id;
      selAd.appendChild(opt);
    });

    // if logged in place: select & lock
    if (currentPlace && currentPlace.id) {
      if ($('adPlaceId')) { $('adPlaceId').value = currentPlace.id; $('adPlaceId').disabled = true; }
      // also show ads tab
      $('tab-btn-ads').style.display = 'inline-block';
      await checkAdQuotaAndToggle(currentPlace.id);
      await loadAdsForPlace(currentPlace.id);
    } else {
      $('tab-btn-ads').style.display = 'none';
    }
  }catch(e){ console.error(e); }
}

async function loadAdsForPlace(placeId){
  if (!placeId) return;
  try{
    const resp = await apiGet('ads',{placeId});
    let ads = [];
    if (resp && resp.success && resp.data && resp.data.ads) ads = resp.data.ads;
    else if (resp && resp.ads) ads = resp.ads;
    else if (Array.isArray(resp)) ads = resp;
    renderAdsList(ads);
  }catch(e){ console.error(e); showError('تعذر جلب الإعلانات'); }
}

function renderAdsList(ads){
  const container = $('adsListContainer'); container.innerHTML = '';
  if (!ads || !ads.length){ container.textContent = 'لا توجد إعلانات حالياً.'; return; }
  ads.forEach(ad=>{
    const div = document.createElement('div'); div.className='ad-item';
    const title = document.createElement('div'); title.style.fontWeight='700'; title.textContent = ad.title || ad.AdTitle || '(بدون عنوان)';
    const meta = document.createElement('div'); meta.className='small'; meta.textContent = `${ad.startDate||ad['تاريخ البداية']||''} — ${ad.endDate||ad['تاريخ النهاية']||''} • ${ad.status||ad['حالة الاعلان']||''}`;
    const desc = document.createElement('div'); desc.textContent = ad.description || ad['الوصف'] || '';
    div.appendChild(title); div.appendChild(meta); div.appendChild(desc);

    if (ad.images && ad.images.length){
      const imgs = document.createElement('div'); imgs.style.display='flex'; imgs.style.gap='8px'; imgs.style.marginTop='8px';
      const arr = Array.isArray(ad.images) ? ad.images : (ad.images && typeof ad.images === 'string' ? JSON.parse(ad.images) : []);
      arr.forEach(img=>{
        let url = '';
        if (typeof img === 'string') url = img;
        else if (img && img.url) url = img.url;
        if (url){
          const iel = document.createElement('img'); iel.src = url; iel.style.width='80px'; iel.style.height='80px'; iel.style.objectFit='cover'; iel.style.borderRadius='6px';
          imgs.appendChild(iel);
        }
      });
      div.appendChild(imgs);
    }

    const actions = document.createElement('div'); actions.style.marginTop='10px';
    const editBtn = document.createElement('button'); editBtn.className='btn'; editBtn.style.marginRight='8px'; editBtn.textContent='تعديل';
    editBtn.addEventListener('click', ()=> startEditAd(ad));
    const delBtn = document.createElement('button'); delBtn.className='btn secondary'; delBtn.textContent='حذف';
    delBtn.addEventListener('click', ()=> deleteAdConfirm(ad.id || ad['ID الإعلان'] || ad.ID));
    actions.appendChild(editBtn); actions.appendChild(delBtn);
    div.appendChild(actions);
    container.appendChild(div);
  });
}

function startEditAd(ad){
  // fill ad form for editing
  editingAdId = ad.id || ad['ID الإعلان'] || ad.ID;
  $('adTitle').value = ad.title || ad['العنوان'] || '';
  $('adDescription').value = ad.description || ad['الوصف'] || '';
  $('startDate').value = ad.startDate || ad['تاريخ البداية'] || '';
  $('endDate').value = ad.endDate || ad['تاريخ النهاية'] || '';
  $('coupon').value = ad.coupon || ad['كوبون خصم'] || '';
  $('adType').value = ad.type || ad['نوع الاعلان'] || '';
  $('adActiveStatus').value = ad.status || ad['حالة الاعلان'] || '';
  if ($('adPlaceId')) { $('adPlaceId').value = ad.placeId || ad['ID المكان'] || ''; $('adPlaceId').disabled = true; }
  // previews
  if (ad.images && ad.images.length){ const pres = $('adImagesPreview'); pres.innerHTML=''; (ad.images||[]).forEach(u=>{
    const img = document.createElement('img'); img.src = (typeof u==='string' ? u : u.url || ''); pres.appendChild(img);
  }); }
  if (ad.video){ const vpre=$('adVideoPreview'); vpre.innerHTML=''; const video = document.createElement('video'); video.src = ad.video; video.controls=true; video.style.width='100%'; vpre.appendChild(video); }
  showTab('ads');
}

async function saveAd(){
  try{
    showLoading(true);
    const form = $('adForm');
    const placeId = form.placeId.value || (currentPlace && currentPlace.id);
    if (!placeId) { showError('اختر المكان أولاً'); return; }

    // upload images sequentially and collect URLs
    const files = $('adImages').files ? Array.from($('adImages').files).slice(0,8) : [];
    const imageUrls = [];
    for (const f of files){
      const up = await uploadFileToServer(f, placeId);
      const url = up && (up.fileUrl || up.url) ? (up.fileUrl || up.url) : null;
      if (url) imageUrls.push(url);
    }
    // upload video if present
    let videoUrl = '';
    const vfile = $('adVideo').files && $('adVideo').files[0];
    if (vfile){
      const upv = await uploadFileToServer(vfile, placeId);
      videoUrl = upv && (upv.fileUrl || upv.url) ? (upv.fileUrl || upv.url) : '';
    }

    const payload = {
      action: editingAdId ? 'updateAd' : 'addAd',
      placeId,
      adType: form.adType.value,
      adTitle: form.adTitle.value,
      adDescription: form.adDescription.value,
      startDate: form.startDate.value,
      endDate: form.endDate.value,
      coupon: form.coupon.value || '',
      imageFiles: JSON.stringify(imageUrls.map(u => u)), // code.gs expects names or urls
      videoFile: vfile ? vfile.name : '',
      videoUrl: videoUrl || '',
      adActiveStatus: form.adActiveStatus.value || ''
    };
    if (editingAdId) payload.adId = String(editingAdId);

    // prepare FormData
    const fd = new FormData();
    Object.keys(payload).forEach(k => fd.append(k, payload[k]));
    const resp = await apiPostForm(fd);
    if (!resp || resp.success===false) throw new Error((resp && (resp.error || (resp.data && resp.data.error))) || 'فشل حفظ الإعلان');
    showSuccess(editingAdId ? 'تم تحديث الإعلان' : 'تم إضافة الإعلان');
    // reset form
    editingAdId = null;
    $('adForm').reset();
    $('adImagesPreview').innerHTML = ''; $('adVideoPreview').innerHTML = '';
    await loadAdsForPlace(placeId);
    await checkAdQuotaAndToggle(placeId);
  }catch(err){
    console.error(err); showError(err.message || 'خطأ أثناء حفظ الإعلان');
  }finally{ showLoading(false); }
}

async function deleteAdConfirm(adId){
  if (!confirm('هل ترغب بحذف الإعلان؟')) return;
  try{
    showLoading(true);
    const fd = new FormData();
    fd.append('action','deleteAd');
    fd.append('adId', String(adId));
    const resp = await apiPostForm(fd);
    if (!resp || resp.success===false) throw new Error((resp && (resp.error || (resp.data && resp.data.error))) || 'فشل الحذف');
    showSuccess('تم حذف الإعلان');
    if (currentPlace && currentPlace.id) await loadAdsForPlace(currentPlace.id);
  }catch(err){ console.error(err); showError(err.message || 'خطأ أثناء الحذف'); }finally{ showLoading(false); }
}

/* ------------------ check ad quota ------------------ */
async function checkAdQuotaAndToggle(placeId){
  try{
    const resp = await apiGet('remainingAds',{placeId});
    let data = resp && resp.success && resp.data ? resp.data : resp;
    if (data && data.data) data = data.data;
    const remaining = Number((data && data.remaining) || 0);
    const allowed = Number((data && data.allowed) || 0);
    const used = Number((data && data.used) || 0);
    $('adQuotaSummary').textContent = `الإعلانات: الكل ${allowed} • المستخدمة ${used} • المتبقي ${remaining}`;
    const submitBtn = $('adForm').querySelector('button[type=submit]');
    if (submitBtn) { submitBtn.disabled = remaining<=0; submitBtn.title = remaining<=0 ? 'لقد استنفدت حصة الإعلانات' : ''; }
  }catch(e){ console.error(e); }
}

/* ========================= Preview helpers ========================= */
function previewSingleImage(file, targetId){
  const p = $(targetId); if (!p) return; p.innerHTML = '';
  if (!file) return;
  const fr = new FileReader();
  fr.onload = ()=> { const img = document.createElement('img'); img.src = fr.result; p.appendChild(img); };
  fr.readAsDataURL(file);
}
function previewMultipleImages(files, targetId){
  const p = $(targetId); if (!p) return; p.innerHTML = '';
  files = files || [];
  Array.from(files).slice(0,8).forEach(file=>{
    const fr = new FileReader();
    fr.onload = ()=> { const img = document.createElement('img'); img.src = fr.result; p.appendChild(img); };
    fr.readAsDataURL(file);
  });
}
function previewVideo(file, targetId){
  const p = $(targetId); if (!p) return; p.innerHTML = '';
  if (!file) return;
  const fr = new FileReader();
  fr.onload = ()=> {
    const video = document.createElement('video'); video.controls=true; video.style.maxWidth='320px';
    video.src = fr.result; p.appendChild(video);
  };
  fr.readAsDataURL(file);
}

/* ========================= Subscription bar ========================= */
async function refreshSubscriptionBar(){
  try{
    if (!currentPlace || !currentPlace.id) { $('subscriptionStatusBar').style.display='none'; return; }
    const resp = await apiPostForm((() => { const f=new FormData(); f.append('action','getDashboard'); f.append('placeId',currentPlace.id); return f; })());
    const payload = resp && resp.data ? resp.data : resp;
    const place = payload && payload.place ? payload.place : (payload || {});
    if (!place || !place.raw) return;
    const status = (place.raw['حالة الباقة'] || place.raw['packageStatus'] || '').toString().trim();
    const pkg = (place.raw['الباقة'] || '').toString().trim();
    const start = place.raw['تاريخ بداية الاشتراك'] || '';
    const end = place.raw['تاريخ نهاية الاشتراك'] || '';

    const titleEl = $('subscriptionTitle'); const detailsEl = $('subscriptionDetails'); const countdownEl = $('subscriptionCountdown');
    if (!status || status==='لا يوجد اشتراك'){ $('subscriptionStatusBar').style.display='none'; return; }
    $('subscriptionStatusBar').style.display='block';
    titleEl.textContent = pkg ? `الباقة: ${pkg}` : 'باقة';
    detailsEl.textContent = status === 'نشطة' ? `نشطة — تنتهي: ${end||'غير محدد'}` : (status === 'قيد الدفع' ? 'قيد الدفع — ارفع إيصال الدفع' : `الحالة: ${status}`);
    if (end){
      // countdown days/hours
      const endD = parseDateISO(end);
      if (endD){
        const diff = diffDaysHours(new Date(), endD);
        countdownEl.textContent = `${diff.days} يوم و ${diff.hours} ساعة`;
        // update every minute
        clearInterval(countdownEl._timer);
        countdownEl._timer = setInterval(()=> {
          const d2 = diffDaysHours(new Date(), endD);
          countdownEl.textContent = `${d2.days} يوم و ${d2.hours} ساعة`;
        }, 60000);
      } else countdownEl.textContent = '';
    } else countdownEl.textContent = '';
  }catch(e){ console.error(e); }
}

/* date helpers */
function parseDateISO(s){
  if (!s) return null;
  const parts = s.split('-');
  if (parts.length===3) return new Date(Number(parts[0]), Number(parts[1])-1, Number(parts[2]),23,59,59);
  const d = new Date(s); return isNaN(d.getTime()) ? null : d;
}
function diffDaysHours(a,b){
  let diff = b.getTime()-a.getTime(); if (diff<0) diff=0;
  const days = Math.floor(diff / 86400000); diff -= days*86400000;
  const hours = Math.floor(diff / 3600000);
  return { days, hours };
}

/* ========================= Place status update ========================= */
async function showPlaceStatusBar(place){
  if (!place) return;
  $('placeStatusBar').style.display = 'block';
  const state = place.raw && (place.raw['حالة المكان'] || place.raw['حالة التسجيل'] || place.status) || '';
  $('placeStatusMessage').textContent = state ? `الحالة الحالية: ${state}` : 'الحالة غير محددة';
  document.querySelectorAll('#placeStatusButtons .status-btn').forEach(b=> b.classList.toggle('active', b.dataset.status===state));
}
function hidePlaceStatusBar(){ $('placeStatusBar').style.display='none'; }

async function updatePlaceStatus(newStatus){
  try{
    if (!currentPlace || !currentPlace.id) { showError('سجل الدخول أولاً'); return; }
    showLoading(true);
    const fd = new FormData(); fd.append('action','updatePlace'); fd.append('placeId', String(currentPlace.id)); fd.append('status', newStatus);
    const resp = await apiPostForm(fd);
    if (!resp || resp.success===false) throw new Error((resp && (resp.error || (resp.data && resp.data.error))) || 'فشل التحديث');
    // update local state
    currentPlace.raw = currentPlace.raw || {};
    currentPlace.raw['حالة المكان'] = newStatus;
    currentPlace.raw['حالة التسجيل'] = newStatus;
    saveLocalPlace(currentPlace);
    showPlaceStatusBar(currentPlace);
    showSuccess('تم تحديث حالة المكان');
  }catch(e){ console.error(e); showError(e.message || 'فشل تحديث الحالة'); }finally{ showLoading(false); }
}

/* ========================= Helper functions ========================= */
function escapeHtml(s){ if (!s) return ''; return String(s).replace(/[&<>"']/g, m=> ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

/* ========================= Utilities ========================= */
async function populatePlacesSelects(){
  // (reused earlier) call GET places
  try{
    const resp = await apiGet('places');
    let list = [];
    if (resp && resp.success && resp.data && resp.data.places) list = resp.data.places;
    else if (Array.isArray(resp)) list = resp;
    else if (resp && Array.isArray(resp.places)) list = resp.places;
    const sel = $('adPlaceId'); if (!sel) return;
    sel.innerHTML = '<option value="">اختر</option>';
    list.forEach(p => {
      const o = document.createElement('option'); o.value = p.id; o.textContent = p.name || (p.raw && p.raw['اسم المكان']) || p.id;
      sel.appendChild(o);
    });
    if (currentPlace && currentPlace.id) { sel.value = currentPlace.id; sel.disabled = true; }
  }catch(e){ console.error(e); }
}

/* ========================= Small UI helpers ========================= */
function showTabByName(name){
  window.showTab(name);
}

/* ========================= Extra: set UI elements initially ========================= */
function setUIAfterLogin(place){
  saveLocalPlace(place);
  setUIAfterLogin; // reuse earlier function (duplicate exists above for safety)
}
