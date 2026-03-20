import toast from 'react-hot-toast';

export class ToastService {
  displayToast(message: string, type: 'success' | 'error') {
    if (type === 'success') {
      toast.success(message);
    } else {
      toast.error(message);
    }
  }
}