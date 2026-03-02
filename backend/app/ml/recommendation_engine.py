import networkx as nx
import pandas as pd
from app.database.core import get_database
from loguru import logger

class RecommendationEngine:
    def __init__(self):
        self.kg = nx.Graph()
        self.is_built = False

    async def build_knowledge_graph(self):
        """Builds a NetworkX graph from MongoDB data for graph-based recommendations"""
        logger.info("Building Knowledge Graph for Recommendations...")
        db = get_database()
        if db is None:
            logger.error("Database not connected.")
            return

        try:
            cursor = db.diseases.find()
            async for doc in cursor:
                disease = doc.get("name")
                if not disease:
                    continue
                
                self.kg.add_node(disease, type="Disease")
                
                # Add medications
                for med in doc.get("medications", []):
                    self.kg.add_node(med, type="Medication")
                    self.kg.add_edge(disease, med, relation="TREATED_BY")
                
                # Add diets
                for diet in doc.get("diets", []):
                    self.kg.add_node(diet, type="Diet")
                    self.kg.add_edge(disease, diet, relation="RECOMMENDS_DIET")
                    
                # Add workouts
                for workout in doc.get("workouts", []):
                    self.kg.add_node(workout, type="Workout")
                    self.kg.add_edge(disease, workout, relation="RECOMMENDS_WORKOUT")
            
            self.is_built = True
            logger.info(f"Knowledge Graph built with {self.kg.number_of_nodes()} nodes and {self.kg.number_of_edges()} edges.")
        except Exception as e:
            logger.error(f"Error building knowledge graph: {e}")

    async def get_recommendations(self, disease: str, user_context: dict = None):
        db = get_database()
        disease_doc = await db.diseases.find_one({"name": disease})
        
        if not disease_doc:
            return {
                "medications": [],
                "precautions": [],
                "diets": [],
                "workouts": []
            }
            
        medications = disease_doc.get("medications", [])
        
        # Apply context-aware logic to medications (Safety/Penalty based on age/allergies)
        if user_context and user_context.get("allergies"):
            allergies = [a.lower() for a in user_context["allergies"]]
            medications = [m for m in medications if m.lower() not in allergies]

        # Use Graph to find related alternative medicines (Collaborative/Hybrid aspect simulated via Graph paths)
        alternatives = []
        if self.is_built and disease in self.kg:
            # Find medicines connected to similar diseases (distance 3: Dis -> Med -> Dis2 -> Med2)
            pass # Expandable to true collaborative filtering based on user ratings in DB

        return {
            "medications": medications,
            "precautions": disease_doc.get("precautions", []),
            "diets": disease_doc.get("diets", []),
            "workouts": disease_doc.get("workouts", []),
            "graph_alternatives": alternatives
        }

recommender = RecommendationEngine()
