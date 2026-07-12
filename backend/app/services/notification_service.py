import uuid
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification, NotificationSeverity, NotificationType


class NotificationService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(
        self,
        *,
        notification_type: NotificationType,
        title: str,
        message: str,
        user_id: Optional[uuid.UUID] = None,
        severity: NotificationSeverity = NotificationSeverity.INFO,
        entity_type: Optional[str] = None,
        entity_id: Optional[str] = None,
    ) -> Notification:
        notif = Notification(
            user_id=user_id,
            notification_type=notification_type,
            severity=severity,
            title=title,
            message=message,
            entity_type=entity_type,
            entity_id=entity_id,
        )
        self.session.add(notif)
        await self.session.flush()
        return notif

    async def alert_license_expiry(
        self, driver_id: str, driver_name: str, expiry_date: str, days_remaining: int
    ) -> Notification:
        severity = (
            NotificationSeverity.CRITICAL if days_remaining <= 7
            else NotificationSeverity.WARNING
        )
        return await self.create(
            notification_type=NotificationType.LICENSE_EXPIRY,
            severity=severity,
            title=f"Driver License Expiring: {driver_name}",
            message=(
                f"Driver '{driver_name}' license expires on {expiry_date} "
                f"({days_remaining} days remaining). Please renew."
            ),
            entity_type="Driver",
            entity_id=driver_id,
        )

    async def alert_trip_dispatched(
        self,
        trip_number: str,
        vehicle_registration: str,
        driver_name: str,
        user_id: Optional[uuid.UUID] = None,
    ) -> Notification:
        return await self.create(
            notification_type=NotificationType.TRIP_DISPATCHED,
            severity=NotificationSeverity.INFO,
            title=f"Trip Dispatched: {trip_number}",
            message=(
                f"Trip {trip_number} dispatched. "
                f"Vehicle: {vehicle_registration}, Driver: {driver_name}"
            ),
            user_id=user_id,
            entity_type="Trip",
        )

    async def alert_trip_completed(
        self,
        trip_number: str,
        distance_km: Optional[float],
        user_id: Optional[uuid.UUID] = None,
    ) -> Notification:
        distance_str = f" Distance: {distance_km:.1f} km." if distance_km else ""
        return await self.create(
            notification_type=NotificationType.TRIP_COMPLETED,
            severity=NotificationSeverity.INFO,
            title=f"Trip Completed: {trip_number}",
            message=f"Trip {trip_number} has been completed successfully.{distance_str}",
            user_id=user_id,
            entity_type="Trip",
        )

    async def alert_vehicle_in_shop(
        self, vehicle_registration: str, vehicle_id: str
    ) -> Notification:
        return await self.create(
            notification_type=NotificationType.VEHICLE_IN_SHOP,
            severity=NotificationSeverity.WARNING,
            title=f"Vehicle In Shop: {vehicle_registration}",
            message=f"Vehicle {vehicle_registration} has been sent to the maintenance shop.",
            entity_type="Vehicle",
            entity_id=vehicle_id,
        )

    async def get_unread(self, user_id: uuid.UUID) -> List[Notification]:
        stmt = select(Notification).where(
            Notification.user_id == user_id,
            Notification.is_read == False,
        ).order_by(Notification.created_at.desc())
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def mark_as_read(self, notification_id: uuid.UUID) -> Optional[Notification]:
        from datetime import datetime, timezone
        notif = await self.session.get(Notification, notification_id)
        if notif:
            notif.is_read = True
            notif.read_at = datetime.now(timezone.utc)
            self.session.add(notif)
            await self.session.flush()
        return notif
