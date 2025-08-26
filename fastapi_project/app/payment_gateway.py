from enum import Enum
import random
from datetime import datetime

class PaymentResult(str, Enum):
    SUCCESS = "success"
    FAILED = "failed"
    PENDING = "pending"

class FakePaymentGateway:
    @staticmethod
    def process_payment(amount: float, card_number: str) -> dict:
        """
        Fake to'lov jarayoni
        Bu yerda to'lov kartasi bilan ishlashni simulyatsiya qilamiz
        """
        # Karta raqamini tekshirish (sodda validatsiya)
        if not card_number or len(card_number) != 16 or not card_number.isdigit():
            return {
                "status": PaymentResult.FAILED,
                "message": "Invalid card number",
                "transaction_id": None,
                "timestamp": datetime.utcnow()
            }

        # Random success/failure (80% success rate)
        is_successful = random.random() < 0.8

        if is_successful:
            return {
                "status": PaymentResult.SUCCESS,
                "message": "Payment processed successfully",
                "transaction_id": f"TXN_{random.randint(10000, 99999)}",
                "timestamp": datetime.utcnow()
            }
        else:
            return {
                "status": PaymentResult.FAILED,
                "message": "Payment failed. Please try again.",
                "transaction_id": None,
                "timestamp": datetime.utcnow()
            }

# Payment gateway instance
payment_gateway = FakePaymentGateway()