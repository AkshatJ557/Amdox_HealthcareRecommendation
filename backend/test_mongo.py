import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import certifi
import sys

uri = "mongodb+srv://<username>:<password>@cluster0.osp01mq.mongodb.net/healthcare_db?retryWrites=true&w=majority&appName=Cluster0"

async def test():
    print("Testing certifi...")
    try:
        client = AsyncIOMotorClient(uri, tls=True, tlsCAFile=certifi.where())
        await client.admin.command('ping')
        print("SUCCESS with certifi")
        return
    except Exception as e:
        print("FAILED certifi:", type(e).__name__, str(e))

    print("Testing tlsAllowInvalidCertificates...")
    try:
        client2 = AsyncIOMotorClient(uri, tls=True, tlsAllowInvalidCertificates=True)
        await client2.admin.command('ping')
        print("SUCCESS with tlsAllowInvalidCertificates")
        return
    except Exception as e:
        print("FAILED tlsAllowInvalidCertificates:", type(e).__name__, str(e))

asyncio.run(test())
