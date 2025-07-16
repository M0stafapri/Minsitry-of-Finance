// سكريبت لتحديث رحلة محددة برقم "91133492" ليظهر اسم الموظف "مروان صالح"

// وظيفة للتحديث يتم تنفيذها فور تحميل الصفحة
function updateSpecificTrip() {
  try {
    // قراءة الرحلات من التخزين المحلي
    const tripsJSON = localStorage.getItem('trips');
    if (!tripsJSON) {
      console.log('لا توجد رحلات في التخزين المحلي');
      return;
    }

    // تحويل النص إلى كائن JavaScript
    const trips = JSON.parse(tripsJSON);

    // البحث عن الرحلة المحددة برقم 91133492
    const tripIndex = trips.findIndex(trip => trip.tripNumber === '91133492');

    // إذا لم يتم العثور على الرحلة
    if (tripIndex === -1) {
      console.log('لم يتم العثور على الرحلة برقم 91133492');
      return;
    }

    // تحديث اسم الموظف للرحلة المحددة
    trips[tripIndex].employee = 'مروان صالح';

    // حفظ التغييرات في التخزين المحلي
    localStorage.setItem('trips', JSON.stringify(trips));

    console.log('تم تحديث الرحلة برقم 91133492 بنجاح. الموظف المسؤول الآن هو: مروان صالح');
  } catch (error) {
    console.error('حدث خطأ أثناء تحديث الرحلة:', error);
  }
}

// تنفيذ وظيفة التحديث
updateSpecificTrip();
