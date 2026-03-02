import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import ssl
import certifi

uri = "mongodb+srv://<username>:<password>@cluster0.osp01mq.mongodb.net/healthcare_db?retryWrites=true&w=majority&appName=Cluster0"

async def test():
    try:
        client = AsyncIOMotorClient(uri, tls=True, tlsCAFile=certifi.where())
        await client.admin.command('ping')
        print("Success with certifi")
        return
    except Exception as e:
        print("Failed certifi:", type(e).__name__)

    try:
        ctx = ssl.create_default_context(cafile=certifi.where())
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        client2 = AsyncIOMotorClient(uri, tls=True, tlsAllowInvalidCertificates=True, tlsAllowInvalidHostnames=True)
        await client2.admin.command('ping')
        print("Success with CERT_NONE flags")
    except Exception as e:
        print("Failed CERT_NONE:", type(e).__name__)

asyncio.run(test())
