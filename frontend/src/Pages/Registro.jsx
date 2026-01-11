import React, { useState } from 'react';
import { 
  UserPlus, User, Mail, Lock, Shield, AlertCircle, 
  CheckCircle, Loader, Eye, EyeOff, ArrowRight, Info,
  ChevronDown, ExternalLink
} from 'lucide-react';
import '../styles/public/registro.css';

const API_URL = 'http://localhost:8000/api';

const Registro = () => {
  const [formData, setFormData] = useState({
    id_rol: '1',
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    password_confirmation: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [activeStep, setActiveStep] = useState(1); // Para un diseño por pasos opcional

  // Validación de contraseña mejorada
  const checkPasswordStrength = (password) => {
    if (!password) return { strength: 0, text: 'Vacía', color: 'bg-gray-200', requirements: [] };

    const requirements = [
      { regex: /.{8,}/, text: 'Mínimo 8 caracteres', met: false },
      { regex: /[a-z]/, text: 'Una letra minúscula', met: false },
      { regex: /[A-Z]/, text: 'Una letra mayúscula', met: false },
      { regex: /[0-9]/, text: 'Un número', met: false },
      { regex: /[^a-zA-Z0-9]/, text: 'Un carácter especial', met: false },
    ];

    requirements.forEach(req => {
      req.met = req.regex.test(password);
    });

    const metCount = requirements.filter(req => req.met).length;
    const levels = [
      { strength: 1, text: 'Muy débil', color: 'bg-red-500' },
      { strength: 2, text: 'Débil', color: 'bg-orange-500' },
      { strength: 3, text: 'Aceptable', color: 'bg-yellow-500' },
      { strength: 4, text: 'Fuerte', color: 'bg-blue-500' },
      { strength: 5, text: 'Muy fuerte', color: 'bg-green-500' }
    ];

    const result = levels[metCount - 1] || levels[0];
    return { ...result, requirements };
  };

  const passwordStrength = checkPasswordStrength(formData.password);
  const passwordMatch = formData.password && formData.password_confirmation && 
                        formData.password === formData.password_confirmation;

  // Validación del formulario
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.nombre.trim()) newErrors.nombre = ['El nombre es requerido'];
    if (!formData.apellido.trim()) newErrors.apellido = ['El apellido es requerido'];
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = ['El email es requerido'];
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = ['Ingrese un email válido'];
    }
    
    if (formData.password.length < 8) {
      newErrors.password = ['La contraseña debe tener al menos 8 caracteres'];
    }
    
    if (!passwordMatch) {
      newErrors.password_confirmation = ['Las contraseñas no coinciden'];
    }
    
    if (!acceptedTerms) {
      newErrors.terms = ['Debe aceptar los términos y condiciones'];
    }
    
    return newErrors;
  };

  const handleRegister = async () => {
    console.log('='.repeat(50));
    console.log('🚀 INICIANDO REGISTRO');
    console.log('='.repeat(50));
    
    console.log('📝 Datos del formulario:', formData);
    
    // Validaciones previas (las mismas que antes)
    if (!formData.nombre || !formData.apellido) {
      console.error('❌ Error: Nombre y apellido son requeridos');
      setErrors({ general: ['Nombre y apellido son requeridos'] });
      return;
    }
    
    if (!formData.email) {
      console.error('❌ Error: Email es requerido');
      setErrors({ general: ['Email es requerido'] });
      return;
    }
    
    if (!formData.password || formData.password.length < 8) {
      console.error('❌ Error: La contraseña debe tener al menos 8 caracteres');
      setErrors({ general: ['La contraseña debe tener al menos 8 caracteres'] });
      return;
    }
    
    if (!passwordMatch) {
      console.error('❌ Error: Las contraseñas no coinciden');
      setErrors({ general: ['Las contraseñas no coinciden'] });
      return;
    }

    setErrors({});
    setLoading(true);
    
    console.log('🌐 URL de la API:', `${API_URL}/register`);
    console.log('📦 Datos a enviar:', JSON.stringify(formData, null, 2));

    try {
      console.log('⏳ Enviando petición a la API...');
      
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      console.log('📡 Respuesta recibida');
      console.log('Status Code:', response.status);
      console.log('Status Text:', response.statusText);
      console.log('Headers:', Object.fromEntries(response.headers.entries()));

      // Intentamos parsear la respuesta como JSON
      let data;
      const text = await response.text();
      console.log('📄 Respuesta en texto:', text);
      
      try {
        data = JSON.parse(text);
        console.log('📄 Datos de respuesta (JSON):', JSON.stringify(data, null, 2));
      } catch (parseError) {
        console.error('❌ Error al parsear la respuesta como JSON:', parseError);
        setErrors({ 
          general: ['Error en la respuesta del servidor. Por favor, intente nuevamente.'] 
        });
        setLoading(false);
        return;
      }

      if (response.ok) {
        console.log('✅ REGISTRO EXITOSO');
        console.log('👤 Usuario creado:', data.data.usuario);
        console.log('🔑 Token recibido:', data.data.token);
        
        // Guardar el token en localStorage
        localStorage.setItem('auth_token', data.data.token);
        console.log('💾 Token guardado en localStorage');
        
        // Guardar datos del usuario
        localStorage.setItem('user', JSON.stringify(data.data.usuario));
        console.log('💾 Usuario guardado en localStorage');
        
        setSuccess(true);
        console.log('🎉 Estado de éxito actualizado');
        
        setTimeout(() => {
          console.log('🔄 Simulando redirección al dashboard...');
          alert('¡Registro exitoso! Token guardado en localStorage');
        }, 500);
        
      } else {
        console.error('❌ REGISTRO FALLIDO');
        console.error('Mensaje:', data.message);
        
        // Si el backend devuelve un array de errores en el campo 'errors'
        if (data.errors) {
          console.error('📋 Errores de validación:', JSON.stringify(data.errors, null, 2));
          setErrors(data.errors);
        } else if (data.message) {
          console.error('Error general:', data.message);
          setErrors({ general: [data.message] });
        } else {
          console.error('Error desconocido');
          setErrors({ general: ['Error desconocido al registrar usuario'] });
        }
      }
    } catch (err) {
      console.error('💥 ERROR DE CONEXIÓN');
      console.error('Tipo de error:', err.name);
      console.error('Mensaje:', err.message);
      console.error('Stack:', err.stack);
      
      setErrors({ 
        general: [
          'Error de conexión con el servidor.',
          'Verifica que tu API esté corriendo en ' + API_URL,
          'Error: ' + err.message
        ] 
      });
    } finally {
      setLoading(false);
      console.log('🏁 Petición finalizada');
      console.log('='.repeat(50));
    }
  };
  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    
    // Limpiar error específico cuando el usuario empieza a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const isFormValid = () => {
    return (
      formData.nombre.trim() &&
      formData.apellido.trim() &&
      formData.email.trim() &&
      formData.password.length >= 8 &&
      passwordMatch &&
      acceptedTerms
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-800 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Card Principal */}
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden border border-white/20">
          
          {/* Header con gradiente */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="inline-flex items-center justify-center w-14 h-14 bg-white/20 rounded-2xl mb-4 backdrop-blur-sm">
                  <UserPlus className="w-7 h-7" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Crea tu cuenta</h2>
                <p className="text-purple-100">Comienza tu experiencia con nosotros</p>
              </div>
              <div className="text-right">
                <div className="inline-flex items-center justify-center w-10 h-10 bg-white/20 rounded-full text-sm font-bold">
                  1/2
                </div>
              </div>
            </div>
          </div>

          {/* Contenido del formulario */}
          <div className="p-8">
            {/* Mensajes de estado */}
            {errors.general && (
              <div className="mb-6 animate-fadeIn">
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-800 font-medium text-sm">Error en el registro</p>
                    {errors.general.map((error, i) => (
                      <p key={i} className="text-red-700 text-sm mt-1">{error}</p>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {success && (
              <div className="mb-6 animate-fadeIn">
                <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-green-800 font-medium text-sm">¡Registro exitoso!</p>
                    <p className="text-green-700 text-sm mt-1">Redirigiendo al dashboard...</p>
                  </div>
                </div>
              </div>
            )}

            {/* Formulario */}
            <div className="space-y-6">
              {/* Nombre y Apellido */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Nombre
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="relative group">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
                    <input
                      type="text"
                      placeholder="Juan"
                      className={`w-full pl-10 pr-4 py-3 bg-gray-50 border ${errors.nombre ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all duration-200 text-gray-800 group-hover:border-purple-300`}
                      value={formData.nombre}
                      onChange={(e) => handleInputChange('nombre', e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  {errors.nombre && (
                    <p className="text-red-600 text-xs flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {errors.nombre[0]}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Apellido
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="relative group">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
                    <input
                      type="text"
                      placeholder="Pérez"
                      className={`w-full pl-10 pr-4 py-3 bg-gray-50 border ${errors.apellido ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all duration-200 text-gray-800 group-hover:border-purple-300`}
                      value={formData.apellido}
                      onChange={(e) => handleInputChange('apellido', e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  {errors.apellido && (
                    <p className="text-red-600 text-xs flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {errors.apellido[0]}
                    </p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Correo electrónico
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
                  <input
                    type="email"
                    placeholder="tu@email.com"
                    className={`w-full pl-10 pr-4 py-3 bg-gray-50 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all duration-200 text-gray-800 group-hover:border-purple-300`}
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    disabled={loading}
                  />
                </div>
                {errors.email && (
                  <p className="text-red-600 text-xs flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.email[0]}
                  </p>
                )}
              </div>

              {/* Rol */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Tipo de cuenta
                </label>
                <div className="relative group">
                  <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-purple-500 transition-colors z-10" />
                  <select
                    className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all duration-200 text-gray-800 appearance-none cursor-pointer group-hover:border-purple-300"
                    value={formData.id_rol}
                    onChange={(e) => handleInputChange('id_rol', e.target.value)}
                    disabled={loading}
                  >
                    <option value="1">Usuario Regular</option>
                    <option value="2">Administrador</option>
                    <option value="3">Moderador</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Contraseña */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Contraseña
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className={`w-full pl-10 pr-12 py-3 bg-gray-50 border ${errors.password ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all duration-200 text-gray-800 group-hover:border-purple-300`}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    disabled={loading}
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    type="button"
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                
                {/* Indicador de fortaleza */}
                {formData.password && (
                  <div className="mt-3 space-y-2 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-600">Seguridad</span>
                      <span className={`text-xs font-bold ${
                        passwordStrength.strength <= 2 ? 'text-red-600' : 
                        passwordStrength.strength <= 3 ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {passwordStrength.text}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                            level <= passwordStrength.strength ? passwordStrength.color : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                    
                    {/* Requisitos de contraseña */}
                    <div className="space-y-1 mt-2">
                      {passwordStrength.requirements?.map((req, index) => (
                        <div key={index} className="flex items-center gap-2">
                          {req.met ? (
                            <CheckCircle className="w-3 h-3 text-green-500" />
                          ) : (
                            <AlertCircle className="w-3 h-3 text-gray-300" />
                          )}
                          <span className={`text-xs ${req.met ? 'text-green-600' : 'text-gray-500'}`}>
                            {req.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {errors.password && (
                  <p className="text-red-600 text-xs flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.password[0]}
                  </p>
                )}
              </div>

              {/* Confirmar Contraseña */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Confirmar contraseña
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className={`w-full pl-10 pr-12 py-3 bg-gray-50 border ${
                      formData.password_confirmation && !passwordMatch ? 'border-red-500' : 'border-gray-300'
                    } rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all duration-200 text-gray-800 group-hover:border-purple-300`}
                    value={formData.password_confirmation}
                    onChange={(e) => handleInputChange('password_confirmation', e.target.value)}
                    disabled={loading}
                  />
                  <button
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    type="button"
                    aria-label={showConfirmPassword ? "Ocultar confirmación" : "Mostrar confirmación"}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                
                {/* Indicador de coincidencia */}
                {formData.password_confirmation && (
                  <div className={`flex items-center gap-2 mt-2 animate-fadeIn ${
                    passwordMatch ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {passwordMatch ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-xs font-medium">Las contraseñas coinciden</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-xs font-medium">Las contraseñas no coinciden</span>
                      </>
                    )}
                  </div>
                )}
                
                {errors.password_confirmation && (
                  <p className="text-red-600 text-xs flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.password_confirmation[0]}
                  </p>
                )}
              </div>

              {/* Términos y Condiciones */}
              <div className="space-y-2">
                <div className={`flex items-start gap-3 p-4 ${errors.terms ? 'bg-red-50 border border-red-200' : 'bg-gray-50'} rounded-lg transition-all duration-200`}>
                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      id="terms"
                      checked={acceptedTerms}
                      onChange={(e) => {
                        setAcceptedTerms(e.target.checked);
                        if (errors.terms) {
                          setErrors(prev => ({ ...prev, terms: undefined }));
                        }
                      }}
                      className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-2 focus:ring-purple-500 focus:ring-offset-0 mt-0.5 cursor-pointer"
                    />
                  </div>
                  <label htmlFor="terms" className="text-sm text-gray-700 cursor-pointer select-none">
                    Acepto los{' '}
                    <button className="text-purple-600 hover:text-purple-700 font-medium underline transition-colors">
                      Términos y Condiciones
                    </button>
                    {' '}y la{' '}
                    <button className="text-purple-600 hover:text-purple-700 font-medium underline transition-colors">
                      Política de Privacidad
                    </button>
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                </div>
                {errors.terms && (
                  <p className="text-red-600 text-xs flex items-center gap-1 ml-4">
                    <AlertCircle className="w-3 h-3" /> {errors.terms[0]}
                  </p>
                )}
              </div>

              {/* Botón de Registro */}
              <button
                onClick={handleRegister}
                disabled={loading || !isFormValid()}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg flex items-center justify-center gap-3 group relative overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">
                  {loading ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Creando cuenta...
                    </>
                  ) : (
                    <>
                      Crear cuenta
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-700 to-pink-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </button>
            </div>

            {/* Separador */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">¿Ya tienes una cuenta?</span>
              </div>
            </div>

            {/* Link a Login */}
            <div className="text-center">
              <button 
                onClick={() => window.location.href = '/login'}
                className="inline-flex items-center gap-2 text-purple-600 font-semibold hover:text-purple-700 transition-colors group"
                disabled={loading}
              >
                <ArrowRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
                Iniciar sesión
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 py-6 bg-gray-50 border-t border-gray-200 rounded-b-3xl">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <Info className="w-4 h-4" />
              <span>Tu información está protegida con encriptación de grado bancario</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Registro;