import { Button } from "@/components/ui/button";
import { COMPANY } from "@/lib/constants";

export default function WhatsAppButton() {
  const handleWhatsAppClick = () => {
    window.open(`https://wa.me/${COMPANY.whatsapp}`, "_blank");
  };
  
  return (
    <Button
      className="fixed bottom-6 right-6 bg-[#25D366] w-16 h-16 rounded-full flex items-center justify-center shadow-lg hover:bg-[#128C7E] transition duration-300 z-50"
      onClick={handleWhatsAppClick}
      size="icon"
      aria-label="Chat on WhatsApp"
    >
      <i className="fab fa-whatsapp text-white text-3xl"></i>
    </Button>
  );
}
