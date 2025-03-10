def send_winner_notification(user_id: int, plate_number: str, amount: float):
    # Bu yerda Telegram, SMS yoki email yuborish tizimini integratsiya qilish mumkin
    print(f"🔔 User {user_id} won the bidding for {plate_number} with {amount}!")
