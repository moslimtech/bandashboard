/* ========== Fixed Previews Functions ========== */
function previewImage(input, previewId) {
  const preview = document.getElementById(previewId);
  if (!preview) return;
  preview.innerHTML = '';
  uploadedImages = [];

  if (!input || !input.files || input.files.length === 0) return;

  const file = input.files; // ✅ أخذ الملف الأول

  // ✅ التحقق من وجود الملف أولاً
  if (!file) {
    showError('لم يتم اختيار أي ملف');
    return;
  }

  if (file.size > MAX_IMAGE_SIZE) {
    showError(`حجم الملف كبير جدًا. الحد الأقصى هو ${MAX_IMAGE_SIZE/(1024*1024)}MB`);
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const previewContainer = document.createElement('div');
      previewContainer.className = 'preview-container';

      // ✅ التحقق من نوع الملف بشكل آمن
      if (file.type && file.type.startsWith('image/')) {
        const img = document.createElement('img');
        img.src = e.target.result;
        img.style.maxWidth = '100%';
        img.style.maxHeight = '200px';
        img.style.borderRadius = '8px';
        img.onerror = function() {
          showFileInfo(previewContainer, file);
        };
        previewContainer.appendChild(img);
      } else {
        showFileInfo(previewContainer, file);
      }

      preview.appendChild(previewContainer);
      uploadedImages = [file]; // ✅ حفظ الملف في المصفوفة
    } catch (error) {
      console.error('Error creating preview:', error);
      uploadedImages = [file]; // ✅ حفظ الملف حتى لو فشلت المعاينة
    }
  };

  reader.onerror = function() {
    console.error('FileReader error for file:', file.name);
    uploadedImages = [file]; // ✅ حفظ الملف حتى لو فشلت القراءة
  };

  try {
    reader.readAsDataURL(file);
  } catch (error) {
    console.error('FileReader read error:', error);
    uploadedImages = [file]; // ✅ حفظ الملف حتى لو فشل FileReader
  }
}

function previewMultipleImages(input, previewId) {
  const preview = document.getElementById(previewId);
  if (!preview) return;
  preview.innerHTML = '';
  uploadedImages = [];

  if (!input || !input.files || input.files.length === 0) return;

  const files = Array.from(input.files).slice(0, 8);
  if (input.files.length > 8) {
    showError('يمكن تحميل حتى 8 ملفات كحد أقصى. سيتم أخذ أول 8 ملفات.');
  }

  files.forEach((file) => {
    // ✅ التحقق من صحة الملف
    if (!file || !(file instanceof File)) {
      console.warn('Invalid file object:', file);
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      showError(`حجم الملف ${file.name} كبير جدًا. الحد الأقصى هو ${MAX_IMAGE_SIZE/(1024*1024)}MB`);
      return;
    }

    const previewItem = document.createElement('div');
    previewItem.className = 'preview-image';
    previewItem.style.position = 'relative';
    previewItem.style.display = 'inline-block';
    previewItem.style.margin = '5px';

    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        // ✅ التحقق الآمن من نوع الملف
        if (file.type && file.type.startsWith('image/')) {
          const img = document.createElement('img');
          img.src = e.target.result;
          img.style.maxWidth = '150px';
          img.style.maxHeight = '150px';
          img.style.borderRadius = '4px';
          img.onerror = function() {
            img.style.display = 'none';
            showFileInfo(previewItem, file);
          };
          previewItem.appendChild(img);
        } else {
          showFileInfo(previewItem, file);
        }

        const removeBtn = createRemoveButton(() => {
          previewItem.remove();
          uploadedImages = uploadedImages.filter(f => f !== file);
        });

        previewItem.appendChild(removeBtn);
        preview.appendChild(previewItem);
        uploadedImages.push(file);
      } catch (error) {
        console.error('Error creating preview for file:', file.name, error);
        // ✅ إضافة الملف حتى لو فشلت المعاينة
        if (!uploadedImages.includes(file)) {
          uploadedImages.push(file);
          showFileInfo(previewItem, file);
          const removeBtn = createRemoveButton(() => {
            previewItem.remove();
            uploadedImages = uploadedImages.filter(f => f !== file);
          });
          previewItem.appendChild(removeBtn);
          preview.appendChild(previewItem);
        }
      }
    };

    reader.onerror = function() {
      console.error('FileReader error for file:', file.name);
      if (!uploadedImages.includes(file)) {
        uploadedImages.push(file);
        showFileInfo(previewItem, file);
        const removeBtn = createRemoveButton(() => {
          previewItem.remove();
          uploadedImages = uploadedImages.filter(f => f !== file);
        });
        previewItem.appendChild(removeBtn);
        preview.appendChild(previewItem);
      }
    };

    try {
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('FileReader read error:', error);
      if (!uploadedImages.includes(file)) {
        uploadedImages.push(file);
        showFileInfo(previewItem, file);
        const removeBtn = createRemoveButton(() => {
          previewItem.remove();
          uploadedImages = uploadedImages.filter(f => f !== file);
        });
        previewItem.appendChild(removeBtn);
        preview.appendChild(previewItem);
      }
    }
  });
}

function previewVideo(input, previewId) {
  const preview = document.getElementById(previewId);
  if (!preview) return;
  preview.innerHTML = '';
  uploadedVideos = [];

  if (!input || !input.files || input.files.length === 0) return;

  const file = input.files; // ✅ أخذ الملف الأول

  // ✅ التحقق من وجود الملف
  if (!file) {
    showError('لم يتم اختيار أي ملف');
    return;
  }

  if (file.size > MAX_VIDEO_SIZE) {
    showError(`حجم الملف كبير جدًا. الحد الأقصى هو ${MAX_VIDEO_SIZE/(1024*1024)}MB`);
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const previewContainer = document.createElement('div');
      previewContainer.className = 'video-preview-container';

      // ✅ التحقق الآمن من نوع الملف
      if (file.type && file.type.startsWith('video/')) {
        const video = document.createElement('video');
        video.src = e.target.result;
        video.controls = true;
        video.style.width = '100%';
        video.style.maxHeight = '300px';
        video.style.borderRadius = '8px';
        video.onerror = function() {
          showFileInfo(previewContainer, file);
        };
        previewContainer.appendChild(video);
      } else {
        showFileInfo(previewContainer, file);
      }

      preview.appendChild(previewContainer);
      uploadedVideos = [file]; // ✅ حفظ الملف
    } catch (error) {
      console.error('Error creating video preview:', error);
      uploadedVideos = [file]; // ✅ حفظ الملف حتى لو فشلت المعاينة
    }
  };

  reader.onerror = function() {
    console.error('FileReader error for file:', file.name);
    uploadedVideos = [file]; // ✅ حفظ الملف حتى لو فشلت القراءة
  };

  try {
    reader.readAsDataURL(file);
  } catch (error) {
    console.error('FileReader read error:', error);
    uploadedVideos = [file]; // ✅ حفظ الملف حتى لو فشل FileReader
  }
}

/* ========== Fixed handlePositionAndFill ========== */
async function handlePositionAndFill(lat, lng) {
  try {
    const mapEl = document.querySelector('input[name="mapLink"]') || document.getElementById('mapLinkInput');
    if (mapEl) {
      mapEl.value = buildGoogleMapsLink(lat, lng);
      try { mapEl.dispatchEvent(new Event('input', { bubbles: true })); } catch(e){}
      try { mapEl.dispatchEvent(new Event('change', { bubbles: true })); } catch(e){}
    }
    
    const msgEl = document.getElementById('placeStatusMessage'); 
    if (msgEl) msgEl.textContent = `الإحداثيات: ${lat.toFixed(6)}, ${lng.toFixed(6)}`; // ✅ إصلاح msgEl بدلاً من msg
    
    const geo = await reverseGeocodeNominatim(lat, lng);
    if (!geo) return;
    
    const detailed = geo.display_name || '';
    const address = geo.address || {};
    const detailedEl = document.querySelector('input[name="detailedAddress"]');
    if (detailedEl && (!detailedEl.value || detailedEl.value.trim() === '')) 
      detailedEl.value = detailed;
    
    const cityCandidates = [address.city, address.town, address.village, address.county, address.state];
    const areaCandidates = [address.suburb, address.neighbourhood, address.hamlet, address.village, address.city_district];
    const cityVal = cityCandidates.find(Boolean);
    if (cityVal) { 
      await setSelectValueWhenReady('select[name="city"]', cityVal); 
      try { updateAreas(); } catch(e){} 
    }
    const areaVal = areaCandidates.find(Boolean);
    if (areaVal) { 
      await setSelectValueWhenReady('select[name="area"]', areaVal); 
    }
  } catch (e) { 
    console.error('handlePositionAndFill error', e); 
  }
}

/* ========== Fixed handlePlaceSubmit ========== */
async function handlePlaceSubmit(ev) {
  ev.preventDefault();
  showLoading(true);
  const submitBtn = document.getElementById('savePlaceBtn');
  const oldHtml = submitBtn ? submitBtn.innerHTML : '';
  if (submitBtn) { 
    submitBtn.disabled = true; 
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحفظ...'; 
  }
  
  try {
    const form = ev.target;
    const formData = new FormData(form);
    const placeData = {
      placeName: formData.get('placeName'),
      activityType: formData.get('activityType'),
      city: formData.get('city'),
      area: formData.get('area'),
      location: formData.get('location'),
      detailedAddress: formData.get('detailedAddress'),
      mapLink: formData.get('mapLink'),
      phone: formData.get('phone'),
      whatsappLink: formData.get('whatsappLink'),
      email: formData.get('email'),
      website: formData.get('website'),
      workingHours: formData.get('workingHours'),
      delivery: formData.get('delivery'),
      package: formData.get('package'),
      description: formData.get('description'),
      password: formData.get('password'),
      status: formData.get('status'),
      image: uploadedImages.length > 0 ? uploadedImages : null // ✅ إصلاح: أخذ الملف الأول وليس المصفوفة
    };

    if (!validateFiles()) { 
      showLoading(false); 
      return; 
    }

    const logged = getLoggedPlace();
    let imageUrl = '';
    if (placeData.image) {
      const placeIdForUpload = (logged && logged.id) ? logged.id : null;
      imageUrl = await uploadToGoogleDrive(placeData.image, 'places', placeIdForUpload);
    }

    const payload = { action: (logged && logged.id) ? 'updatePlace' : 'registerPlace' };
    if (logged && logged.id) payload.placeId = logged.id;
    const setIf = (k, v) => { if (v !== undefined && v !== null && String(v).trim() !== '') payload[k] = v; };
    setIf('name', placeData.placeName);
    setIf('activityId', placeData.activityType);
    setIf('activity', placeData.activityType);
    setIf('activityType', placeData.activityType);
    setIf('city', placeData.city);
    setIf('area', placeData.area);
    setIf('mall', placeData.location);
    setIf('address', placeData.detailedAddress);
    setIf('mapLink', placeData.mapLink);
    setIf('phone', placeData.phone);
    setIf('whatsappLink', placeData.whatsappLink);
    setIf('email', placeData.email);
    setIf('website', placeData.website);
    setIf('hours', placeData.workingHours);
    setIf('delivery', placeData.delivery);
    setIf('description', placeData.description);
    setIf('packageId', placeData.package);
    setIf('password', placeData.password);
    setIf('logoUrl', imageUrl);
    setIf('status', placeData.status);

    const resp = await apiPost(payload);
    if (!resp.ok) throw new Error('فشل في التواصل مع الخادم عند حفظ المكان');
    const data = resp.data;
    if (!data || data.success === false) { 
      const err = data && data.error ? data.error : JSON.stringify(data); 
      throw new Error(err); 
    }

    const returned = (data && data.data) ? data.data : data;
    if (returned.place) { 
      await setLoggedInUI(returned.place); 
    } else if (returned.id) {
      const fetched = await fetchPlace(returned.id);
      if (fetched) await setLoggedInUI(fetched);
    } else if (data.data && data.data.place) { 
      await setLoggedInUI(data.data.place); 
    }

    showSuccess('تم حفظ المكان بنجاح!');
    const preview = document.getElementById('placeImagePreview'); 
    if (preview) preview.innerHTML = '';
    uploadedImages = [];
    await loadLookupsAndPopulate();
    loadPlacesForAds();
    const newLogged = getLoggedPlace(); 
    if (newLogged && newLogged.id) { 
      if (typeof checkAdQuotaAndToggle === 'function') checkAdQuotaAndToggle(newLogged.id); 
      if (typeof loadAdsForPlace === 'function') loadAdsForPlace(newLogged.id); 
    }
  } catch (err) {
    console.error('handlePlaceSubmit error', err);
    showError(err.message || 'حدث خطأ أثناء حفظ المكان');
  } finally { 
    showLoading(false); 
    if (submitBtn) { 
      submitBtn.disabled = false; 
      submitBtn.innerHTML = oldHtml || '<i class="fas fa-save"></i> حفظ'; 
    } 
  }
}

/* ========== Fixed handleAdSubmit ========== */
async function handleAdSubmit(ev) {
  ev.preventDefault();
  showLoading(true);
  
  try {
    const form = ev.target;
    const fd = new FormData(form);
    const adData = {
      placeId: fd.get('placeId'),
      adType: fd.get('adType'),
      adTitle: fd.get('adTitle'),
      coupon: fd.get('coupon'),
      adDescription: fd.get('adDescription'),
      startDate: fd.get('startDate'),
      endDate: fd.get('endDate'),
      adStatus: fd.get('adStatus'),
      adActiveStatus: fd.get('adActiveStatus'),
      images: uploadedImages,
      video: uploadedVideos.length > 0 ? uploadedVideos : null // ✅ إصلاح: أخذ الملف الأول
    };

    if (!validateFiles()) { 
      showLoading(false); 
      return; 
    }

    const imageUrls = [];
    for (let i = 0; i < Math.min(adData.images.length, 8); i++) {
      const file = adData.images[i];
      const url = await uploadToGoogleDrive(file, 'ads');
      imageUrls.push({ name: file.name, url });
    }
    
    let videoUrl = '';
    if (adData.video) {
      videoUrl = await uploadToGoogleDrive(adData.video, 'ads');
    }

    imageUrls.forEach(i => { 
      recentUploads[i.name] = { url: i.url, name: i.name }; 
    });

    const logged = getLoggedPlace();
    const placeIdToSend = (adData.placeId && adData.placeId !== '') ? 
                         adData.placeId : 
                         (logged && logged.id ? logged.id : '');

    const payloadBase = {
      placeId: placeIdToSend,
      adType: adData.adType,
      adTitle: adData.adTitle,
      adDescription: adData.adDescription,
      startDate: adData.startDate,
      endDate: adData.endDate,
      coupon: adData.coupon || '',
      imageFiles: JSON.stringify(imageUrls.map(i => i.name || '')),
      imageUrls: JSON.stringify(imageUrls.map(i => i.url || '')),
      videoFile: adData.video ? (adData.video.name || '') : '',
      videoUrl: videoUrl || '',
      adStatus: adData.adStatus || '',
      adActiveStatus: adData.adActiveStatus || ''
    };

    if (editingAdId) {
      const resp = await apiPost({ action: 'updateAd', adId: editingAdId, ...payloadBase });
      if (!resp.ok) throw new Error('فشل تحديث الإعلان');
      const data = resp.data;
      if (data && data.success === false) throw new Error(data.error || 'فشل تحديث الإعلان');
      showSuccess('تم تحديث الإعلان');
      if (typeof loadAdsForPlace === 'function') await loadAdsForPlace(placeIdToSend);
      editingAdId = null;
      const submitBtn = document.querySelector('#adForm button[type="submit"]'); 
      if (submitBtn) submitBtn.textContent = 'حفظ الإعلان';
    } else {
      const resp = await apiPost({ action: 'addAd', ...payloadBase });
      if (!resp.ok) throw new Error('فشل حفظ الإعلان');
      const data = resp.data;
      if (data && data.success === false) throw new Error(data.error || 'فشل حفظ الإعلان');

      const returned = (data && data.data) ? data.data : data;
      const newAdTemp = {
        id: (returned && returned.id) ? returned.id : ('tmp_' + Date.now()),
        placeId: placeIdToSend,
        type: adData.adType,
        title: adData.adTitle,
        description: adData.adDescription,
        startDate: adData.startDate,
        endDate: adData.endDate,
        status: adData.adStatus || adData.adActiveStatus || '',
        images: imageUrls.map(i => ({ name: i.name, url: i.url })),
        videoUrl: videoUrl || ''
      };
      showSuccess('تم حفظ الإعلان');
      prependAdToList(newAdTemp);
    }

    ev.target.reset();
    const ip = document.getElementById('adImagesPreview'); 
    if (ip) ip.innerHTML = '';
    const vp = document.getElementById('adVideoPreview'); 
    if (vp) vp.innerHTML = '';
    uploadedImages = []; 
    uploadedVideos = [];

    if (placeIdToSend) {
      if (typeof checkAdQuotaAndToggle === 'function') await checkAdQuotaAndToggle(placeIdToSend);
      if (typeof loadAdsForPlace === 'function') await loadAdsForPlace(placeIdToSend);
    }
  } catch (err) {
    console.error('handleAdSubmit error', err);
    showError(err.message || 'حدث خطأ أثناء حفظ الإعلان');
  } finally { 
    showLoading(false); 
  }
}

/* ========== Fixed parseDateISO ========== */
function parseDateISO(d) {
  if (!d) return null;
  try {
    if (d instanceof Date) return d;
    const s = String(d).trim();
    if (!s) return null;
    const parts = s.split('-');
    if (parts.length === 3) {
      const y = Number(parts); // ✅ إصلاح: استخدام parts بدلاً من parts
      const m = Number(parts[1]) - 1; 
      const day = Number(parts[2]);
      const dt = new Date(y, m, day);
      dt.setHours(23,59,59,999);
      return dt;
    }
    const dt2 = new Date(s);
    return isNaN(dt2.getTime()) ? null : dt2;
  } catch { 
    return null; 
  }
}

/* ========== Fixed Payment Modal ========== */
function showPaymentModal({ paymentId, amount, currency, placeId }) {
  const existing = document.getElementById('pm_modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'pm_modal';
  modal.style = `position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:9999;`;
  modal.innerHTML = `
    <div style="background:#fff;padding:18px;border-radius:10px;max-width:720px;width:95%;direction:rtl;color:#111">
      <h3 style="margin-top:0">معلومات الدفع</h3>
      <p>معرف طلب الدفع: <strong id="pm_paymentId">${escapeHtml(paymentId)}</strong></p>
      <p>المبلغ المطلوب: <strong>${escapeHtml(String(amount))} ${escapeHtml(String(currency))}</strong></p>
      <h4>طرق الدفع المتاحة</h4>
      <div id="pm_methods" style="margin-bottom:8px"></div>
      <label style="display:block;margin-top:8px">ارفق إيصال الدفع (أي ملف)</label>
      <input type="file" id="pm_receipt" style="display:block;margin:8px 0" />
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px">
        <button id="pm_cancel" class="btn btn-secondary">إلغاء</button>
        <button id="pm_send" class="btn btn-primary">أرسل الإيصال</button>
      </div>
      <div id="pm_msg" style="margin-top:10px;color:#333"></div>
    </div>
  `;
  document.body.appendChild(modal);

  const methodsContainer = modal.querySelector('#pm_methods');
  const methods = window.availablePaymentMethods || [];
  if (methods && methods.length) {
    methods.forEach(m => {
      const div = document.createElement('div');
      div.style = 'padding:8px;border-radius:6px;border:1px solid #eee;margin-bottom:6px;background:#fafafa';
      const name = m.name || m['طرق الدفع'] || (m.raw && (m.raw['طرق الدفع'] || m.raw['طريقة الدفع'])) || 'طريقة دفع';
      const id = (m.raw && (m.raw['معرف الدفع'] || m.id)) ? (m.raw['معرف الدفع'] || m.id) : '';
      div.innerHTML = `<strong style="display:block">${escapeHtml(name)}</strong>${id ? `<div style="color:#666;margin-top:4px">تفاصيل: ${escapeHtml(String(id))}</div>` : ''}`;
      methodsContainer.appendChild(div);
    });
  } else {
    methodsContainer.textContent = 'لا توجد طرق دفع معرفة. تواصل مع الإدارة.';
  }

  const inputFile = modal.querySelector('#pm_receipt');
  const btnCancel = modal.querySelector('#pm_cancel');
  const btnSend = modal.querySelector('#pm_send');
  const msg = modal.querySelector('#pm_msg');

  btnCancel.addEventListener('click', () => modal.remove());

  btnSend.addEventListener('click', async () => {
    if (!inputFile.files || inputFile.files.length === 0) {
      msg.textContent = 'الرجاء اختيار ملف الإيصال أولاً';
      return;
    }
    btnSend.disabled = true;
    msg.textContent = 'جاري رفع الإيصال...';

    try {
      const file = inputFile.files; // ✅ إصلاح: أخذ الملف الأول
      const base64 = await readFileAsBase64(file);

      const uploadPayload = {
        action: 'uploadMedia',
        fileName: file.name,
        mimeType: file.type,
        fileData: base64,
        placeId: placeId || ''
      };
      const uploadResp = await apiPost(uploadPayload);
      if (!uploadResp.ok) throw new Error('فشل رفع الملف');
      const upData = uploadResp.data && uploadResp.data.data ? uploadResp.data.data : uploadResp.data;
      const fileUrl = (upData && (upData.fileUrl || upData.url)) || uploadResp.fileUrl || (uploadResp.data && uploadResp.data.fileUrl) || '';
      if (!fileUrl) {
        console.warn('upload response', uploadResp);
        throw new Error('لم يتم الحصول على رابط الملف بعد الرفع');
      }

      const updatePayload = {
        action: 'updatePaymentRequest',
        paymentId: paymentId,
        updates: { 
          'رابط إيصال الدفع': fileUrl, 
          'receiptUrl': fileUrl, 
          'الحالة': 'receipt_uploaded', 
          'ملاحظات': 'تم رفع إيصال من صاحب المحل' 
        }
      };
      const updateResp = await apiPost(updatePayload);
      if (!updateResp.ok) {
        console.warn('updatePaymentRequest failed', updateResp);
        msg.textContent = 'تم رفع الإيصال لكن فشل ربطه بطلب الدفع في النظام.';
        setTimeout(()=> modal.remove(), 2200);
        return;
      }

      msg.textContent = 'تم إرسال الإيصال بنجاح. سيتم التحقق والتفعيل قريبًا.';
      setTimeout(()=> modal.remove(), 1800);
    } catch (err) {
      console.error(err);
      msg.textContent = 'حدث خطأ أثناء الإرسال: ' + (err.message || err);
      btnSend.disabled = false;
    }
  });
}
