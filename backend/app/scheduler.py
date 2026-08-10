import asyncio
import datetime
from sqlalchemy.orm import Session
from .database import SessionLocal
from .models import Setting, Item, Warehouse
from .mail_utils import send_warning_email


async def run_scheduler():
    while True:
        try:
            now = datetime.datetime.now()
            # Ensure db is created
            db: Session = SessionLocal()
            try:
                # Iterate through all warehouses
                warehouses = db.query(Warehouse).all()
                for wh in warehouses:
                    if not wh.email_enabled:
                        continue
                        
                    schedule_time = wh.email_schedule_time if wh.email_schedule_time else '08:00'
                    recipients = wh.email_recipients if wh.email_recipients else ''
                    current_time_str = now.strftime("%H:%M")
                    
                    if current_time_str >= schedule_time:
                        today_str = now.strftime("%Y-%m-%d")
                        if wh.email_last_sent_date != today_str:
                            # Fetch low stock items for this specific warehouse
                            items = db.query(Item).filter(
                                Item.kho_id == wh.id,
                                Item.ton_cuoi <= Item.dinh_muc
                            ).all()
                            
                            emails = [e.strip() for e in recipients.replace('\n', ',').split(',') if e.strip()]
                            if emails and items:
                                try:
                                    loop = asyncio.get_event_loop()
                                    await loop.run_in_executor(None, send_warning_email, emails, items, wh.ten_kho)
                                    try:
                                        print(f"[{now}] Automatically sent warning email to {emails} for warehouse {wh.ten_kho}.")
                                    except UnicodeEncodeError:
                                        print(f"[{now}] Automatically sent warning email for warehouse ID {wh.id}")
                                except Exception as e:
                                    try:
                                        print(f"[{now}] Failed to send automatic warning email for warehouse {wh.ten_kho}: {e}")
                                    except UnicodeEncodeError:
                                        print(f"[{now}] Failed to send automatic warning email for warehouse ID {wh.id}: {e}")
                                
                            # We mark it as sent for today REGARDLESS of success or whether there were items/emails to prevent infinite spamming every 30s.
                            try:
                                import sys
                                wh.email_last_sent_date = today_str
                                db.commit()
                                try:
                                    print(f"[{now}] DB Updated to {today_str} for warehouse {wh.ten_kho}")
                                except UnicodeEncodeError:
                                    print(f"[{now}] DB Updated to {today_str} for warehouse ID {wh.id}")
                                sys.stdout.flush()
                            except Exception as commit_ex:
                                import sys
                                try:
                                    print(f"DB Commit failed for {wh.ten_kho}: {commit_ex}")
                                except UnicodeEncodeError:
                                    print(f"DB Commit failed for warehouse ID {wh.id}: {commit_ex}")
                                db.rollback()
                                try:
                                    from sqlalchemy import text
                                    db.execute(text("UPDATE warehouses SET email_last_sent_date = :d WHERE id = :id"), {"d": today_str, "id": wh.id})
                                    db.commit()
                                    print(f"[{now}] Raw SQL Update succeeded")
                                except Exception as e2:
                                    print(f"Raw SQL failed: {e2}")
                                sys.stdout.flush()
            finally:
                db.close()
                
        except Exception as e:
            print(f"Error in background scheduler: {e}")
            
        # Sleep for 30 seconds before checking again
        await asyncio.sleep(30)
