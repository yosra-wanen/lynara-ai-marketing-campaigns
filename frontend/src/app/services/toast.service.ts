import { showToast } from "nextjs-toast-notify";

export class ToastService {

  displayToast(message: string, type: 'success' | 'error') {
    if (type === 'success') {
      showToast.success(message, {
        duration: 4000,
        position: "top-right",
        transition: "bounceIn",
        icon: '',
        sound: true,
      });
    } else {
      showToast.error(message, {
        duration: 4000,
        position: "top-right",
        transition: "bounceIn",
        icon: '',
        sound: true,
      });
    }
  }
}