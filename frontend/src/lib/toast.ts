import { toast, type ToastOptions } from 'react-toastify';

const defaultOptions: ToastOptions = {
  position: 'top-right',
  closeOnClick: true,
  pauseOnHover: true,
};

export function notifySuccess(message: string, options?: ToastOptions) {
  toast.success(message, { ...defaultOptions, ...options });
}

export function notifyError(message: string, options?: ToastOptions) {
  toast.error(message, { ...defaultOptions, ...options });
}

export function notifyInfo(message: string, options?: ToastOptions) {
  toast.info(message, { ...defaultOptions, ...options });
}
