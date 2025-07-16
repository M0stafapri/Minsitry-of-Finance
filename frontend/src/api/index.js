/**
 * وحدة التعامل مع API
 * هذا الملف يحتوي على وظائف للتعامل مع واجهة برمجة التطبيقات
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

/**
 * الحصول على توكن المصادقة من localStorage
 * @returns {string|null} توكن المصادقة أو null إذا لم يكن موجوداً
 */
const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

/**
 * وظيفة مساعدة للتعامل مع طلبات الخادم
 * @param {string} endpoint - نقطة النهاية للطلب
 * @param {Object} options - خيارات الطلب (الطريقة، البيانات، إلخ)
 * @returns {Promise} وعد بنتيجة الطلب
 */
export const apiRequest = async (endpoint, options = {}) => {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log(`[API Request] ${options.method || 'GET'} ${url}`);
    
    let headers = {
      ...options.headers
    };
    // Remove Content-Type for FormData
    if (options.body instanceof FormData) {
      // Let browser set Content-Type with boundary
    } else {
      headers['Content-Type'] = 'application/json';
      if (options.body && typeof options.body === 'object') {
        console.log('[API Request] Body:', JSON.stringify(options.body, null, 2));
        options.body = JSON.stringify(options.body);
      }
    }
    
    const token = getAuthToken();
    console.log('🔐 API Request - Token exists:', !!token);
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log('🔐 API Request - Authorization header set');
    } else {
      console.log('⚠️ API Request - No token found, request will fail');
    }
    
    const response = await fetch(url, {
      headers,
      ...options,
      // Add timeout and SSL configuration
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });
    
    // التعامل مع الاستجابات غير الناجحة
    if (!response.ok) {
      // محاولة الحصول على تفاصيل الخطأ من الخادم
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { message: 'خطأ غير معروف' };
      }
      
      console.error(`[API Error] ${response.status}: ${errorData.message || 'خطأ غير معروف'}`);
      throw {
        status: response.status,
        message: errorData.message || 'حدث خطأ أثناء الاتصال بالخادم',
        data: errorData
      };
    }
    
    // ✅ التعامل مع استجابة 204 No Content
    if (response.status === 204) {
      return null;
    }
    
    const data = await response.json();
    console.log('[API Response]', data);
    return data;
  } catch (error) {
    // التعامل مع أخطاء الشبكة والـ SSL
    if (!error.status) {
      console.error('[API Network Error]', error);
      
      // Handle specific SSL/TLS errors
      if (error.message && error.message.includes('SSL')) {
        throw {
          status: 0,
          message: 'خطأ في الاتصال الآمن. يرجى التحقق من إعدادات الخادم أو استخدام HTTP بدلاً من HTTPS.',
          originalError: error
        };
      }
      
      // Handle timeout errors
      if (error.name === 'AbortError') {
        throw {
          status: 0,
          message: 'انتهت مهلة الاتصال. يرجى المحاولة مرة أخرى.',
          originalError: error
        };
      }
      
      throw {
        status: 0,
        message: 'تعذر الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت الخاص بك.',
        originalError: error
      };
    }
    
    throw error;
  }
};

/**
 * وحدة المستخدمين API
 */
export const userAPI = {
  /**
   * إنشاء مستخدم وموظف جديد
   * @param {Object} userData - بيانات المستخدم والموظف
   * @returns {Promise} وعد بالبيانات الناتجة
   */
  createUserWithEmployee: (userData) => {
    return apiRequest('/users/add-employee', {
      method: 'POST',
      body: userData
    });
  },
  
  /**
   * تسجيل الدخول
   * @param {Object} credentials - بيانات تسجيل الدخول
   * @returns {Promise} وعد ببيانات المستخدم وتوكن الجلسة
   */
  login: (credentials) => {
    return apiRequest('/v1/employees/login', {
      method: 'POST',
      body: credentials
    });
  },
  
  /**
   * تسجيل الخروج
   * @returns {void}
   */
  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
  }
};

/**
 * وحدة الموظفين API
 */
export const employeeAPI = {
  /**
   * الحصول على إحصائيات لوحة التحكم (لا يتطلب مصادقة)
   * @returns {Promise} وعد بإحصائيات لوحة التحكم
   */
  getDashboardStats: () => {
    return apiRequest('/v1/employees/dashboard/stats');
  },

  /**
   * الحصول على قائمة الموظفين
   * @returns {Promise} وعد بقائمة الموظفين
   */
  getAllEmployees: () => {
    return apiRequest('/v1/employees');
  },
  
  /**
   * الحصول على موظف محدد بواسطة المعرف
   * @param {string} id - معرف الموظف
   * @returns {Promise} وعد ببيانات الموظف
   */
  getEmployeeById: (id) => {
    return apiRequest(`/v1/employees/${id}`);
  },
  
  /**
   * تحديث بيانات موظف
   * @param {string} id - معرف الموظف
   * @param {Object} data - البيانات المحدثة
   * @returns {Promise} وعد بالبيانات المحدثة
   */
  updateEmployee: (id, data) => {
    return apiRequest(`/v1/employees/${id}`, {
      method: 'PATCH',
      body: data
    });
  },
  
  /**
   * إنشاء موظف جديد
   * @param {Object} data - بيانات الموظف
   * @returns {Promise} وعد بالبيانات المحدثة
   */
  createEmployee: (data) => {
    return apiRequest('/v1/employees/register', {
      method: 'POST',
      body: data
    });
  }
};

/**
 * وحدة العملاء API
 */
export const customerAPI = {
  /**
   * الحصول على قائمة العملاء
   * @returns {Promise} وعد بقائمة العملاء
   */
  getAllCustomers: () => {
    return apiRequest('/v1/customers');
  },
  
  /**
   * إنشاء عميل جديد
   * @param {Object} data - بيانات العميل
   * @returns {Promise} وعد بالبيانات المحدثة
   */
  createCustomer: (data) => {
    return apiRequest('/v1/customers/addNewCustomer', {
      method: 'POST',
      body: data
    });
  },
  
  /**
   * تحديث بيانات عميل
   * @param {string} id - معرف العميل
   * @param {Object} data - البيانات المحدثة
   * @returns {Promise} وعد بالبيانات المحدثة
   */
  updateCustomer: (id, data) => {
    return apiRequest(`/v1/customers/${id}`, {
      method: 'PATCH',
      body: data
    });
  },
  
  /**
   * حذف عميل
   * @param {string} id - معرف العميل
   * @returns {Promise} وعد بنتيجة الحذف
   */
  deleteCustomer: (id) => {
    return apiRequest(`/v1/customers/${id}`, {
      method: 'DELETE'
    });
  },
  
  /**
   * إلغاء عميل
   * @param {string} id - معرف العميل
   * @returns {Promise} وعد بنتيجة الإلغاء
   */
  revokeCustomer: (id) => {
    return apiRequest(`/v1/customers/${id}/revoke`, {
      method: 'PATCH'
    });
  },
  
  /**
   * تجديد عميل
   * @param {string} id - معرف العميل
   * @returns {Promise} وعد بنتيجة التجديد
   */
  renewCustomer: (id) => {
    return apiRequest(`/v1/customers/${id}/renew`, {
      method: 'PATCH'
    });
  }
};

/**
 * وحدة الموردين API
 */
export const supplierAPI = {
  /**
   * الحصول على قائمة الموردين
   * @returns {Promise} وعد بقائمة الموردين
   */
  getAllSuppliers: () => {
    return apiRequest('/v1/suppliers');
  },
  
  /**
   * إنشاء مورد جديد
   * @param {Object} data - بيانات المورد
   * @returns {Promise} وعد بالبيانات المحدثة
   */
  createSupplier: (data) => {
    return apiRequest('/v1/suppliers/NewSupplier', {
      method: 'POST',
      body: data
    });
  },
  
  /**
   * تحديث بيانات مورد
   * @param {string} id - معرف المورد
   * @param {Object} data - البيانات المحدثة
   * @returns {Promise} وعد بالبيانات المحدثة
   */
  updateSupplier: (id, data) => {
    return apiRequest(`/v1/suppliers/${id}`, {
      method: 'PUT',
      body: data
    });
  },
  
  /**
   * حذف مورد
   * @param {string} id - معرف المورد
   * @returns {Promise} وعد بنتيجة الحذف
   */
  deleteSupplier: (id) => {
    return apiRequest(`/v1/suppliers/${id}`, {
      method: 'DELETE'
    });
  }
};

/**
 * وحدة الرحلات API
 */
export const tripAPI = {
  /**
   * الحصول على قائمة الرحلات من الخادم
   * @returns {Promise} وعد بقائمة الرحلات
   */
  getAllTrips: () => {
    return apiRequest('/v1/trips');
  },
  
  /**
   * الحصول على رحلة محددة بواسطة المعرف
   * @param {string} id - معرف الرحلة
   * @returns {Promise} وعد ببيانات الرحلة
   */
  getTripById: (id) => {
    return apiRequest(`/v1/trips/${id}`);
  },
  
  /**
   * إنشاء رحلة جديدة
   * @param {Object} data - بيانات الرحلة
   * @returns {Promise} وعد بالبيانات المحدثة
   */
  createTrip: (data) => {
    return apiRequest('/v1/trips', {
      method: 'POST',
      body: data
    });
  },
  
  /**
   * تحديث بيانات رحلة
   * @param {string} id - معرف الرحلة
   * @param {Object} data - البيانات المحدثة
   * @returns {Promise} وعد بالبيانات المحدثة
   */
  updateTrip: (id, data) => {
    return apiRequest(`/v1/trips/${id}`, {
      method: 'PATCH',
      body: data
    });
  },
  
  /**
   * حذف رحلة
   * @param {string} id - معرف الرحلة
   * @returns {Promise} وعد بنتيجة الحذف
   */
  deleteTrip: (id) => {
    return apiRequest(`/v1/trips/${id}`, {
      method: 'DELETE'
    });
  },
  
  /**
   * الحصول على قائمة الرحلات من localStorage (fallback)
   * @returns {Array} قائمة الرحلات
   */
  getTripsFromStorage: () => {
    try {
      const trips = localStorage.getItem('trips');
      return trips ? JSON.parse(trips) : [];
    } catch (error) {
      console.error('Error reading trips from localStorage:', error);
      return [];
    }
  },
  
  /**
   * حفظ الرحلات في localStorage
   * @param {Array} trips - قائمة الرحلات
   */
  saveTripsToStorage: (trips) => {
    try {
      localStorage.setItem('trips', JSON.stringify(trips));
    } catch (error) {
      console.error('Error saving trips to localStorage:', error);
    }
  }
};

export const carTypeAPI = {
  addCarType: (name) => apiRequest('/v1/cartypes/add', {
    method: 'POST',
    body: { name }
  }),
  getAllCarTypes: () => apiRequest('/v1/cartypes'),
  deleteCarType: (id) => apiRequest(`/v1/cartypes/${id}`, { method: 'DELETE' }),
};

export const auditLogAPI = {
  /**
   * جلب سجل العمليات لعميل معين
   * @param {string} customerId - معرف العميل
   * @returns {Promise} وعد بسجلات العمليات
   */
  getLogsByCustomer: (customerId) => {
    return apiRequest(`/v1/audit-logs?target=${customerId}&targetModel=Customer`);
  },
};
