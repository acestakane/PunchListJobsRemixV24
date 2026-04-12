import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from auth import get_current_user
from database import db
from utils.notify import create_notification

router = APIRouter()


class ConcernCreate(BaseModel):
    category: str = Field(..., min_length=1, max_length=50)
    subject: str = Field(..., min_length=3, max_length=200)
    description: str = Field(..., min_length=10, max_length=2000)


class ConcernResolve(BaseModel):
    resolution: str = Field(default="", max_length=1000)


@router.post("/")
async def submit_concern(data: ConcernCreate, current_user: dict = Depends(get_current_user)):
    concern = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "user_name": current_user["name"],
        "user_email": current_user["email"],
        "user_role": current_user["role"],
        "category": data.category,
        "subject": data.subject,
        "description": data.description,
        "status": "pending",
        "resolution": "",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.concerns.insert_one(concern)
    concern.pop("_id", None)

    # Alert all admins
    admins = await db.users.find(
        {"role": {"$in": ["admin", "superadmin"]}}, {"_id": 0, "id": 1}
    ).to_list(20)
    for admin in admins:
        await create_notification(
            admin["id"], "concern_submitted", "New Concern Submitted",
            f"{current_user['name']} submitted a concern: '{data.subject}'"
        )

    return concern


@router.get("/mine")
async def my_concerns(current_user: dict = Depends(get_current_user)):
    concerns = await db.concerns.find(
        {"user_id": current_user["id"]}, {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    return concerns


@router.get("/")
async def all_concerns(current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ("admin", "superadmin"):
        raise HTTPException(status_code=403, detail="Admin only")
    concerns = await db.concerns.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return concerns


@router.patch("/{concern_id}/resolve")
async def resolve_concern(
    concern_id: str, data: ConcernResolve, current_user: dict = Depends(get_current_user)
):
    if current_user["role"] not in ("admin", "superadmin"):
        raise HTTPException(status_code=403, detail="Admin only")
    concern = await db.concerns.find_one({"id": concern_id}, {"_id": 0})
    if not concern:
        raise HTTPException(status_code=404, detail="Concern not found")
    await db.concerns.update_one(
        {"id": concern_id},
        {"$set": {
            "status": "resolved",
            "resolution": data.resolution,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }}
    )
    await create_notification(
        concern["user_id"], "concern_resolved", "Your Concern Was Resolved",
        f"Your concern '{concern['subject']}' has been resolved."
    )
    return {"message": "Concern resolved"}
