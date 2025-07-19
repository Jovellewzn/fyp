import requests
import json

def test_ai_endpoints():
    """Test if AI endpoints are working"""
    base_url = "http://localhost:5000"
    
    try:
        print("🧪 Testing AI Bracket Generator Endpoints...")
        print("=" * 50)
        
        # Test tournaments endpoint
        response = requests.get(f"{base_url}/api/ai/tournaments")
        if response.status_code == 200:
            data = response.json()
            if data['success']:
                tournaments = data['tournaments']
                print(f"✅ Found {len(tournaments)} tournaments ready for AI generation")
                
                if tournaments:
                    tournament = tournaments[0]
                    print(f"📋 Sample Tournament: {tournament['title']}")
                    print(f"🎮 Game: {tournament['game_type']}")
                    print(f"👥 Players: {tournament['participant_count']}")
                    
                    # Test participants endpoint
                    tournament_id = tournament['id']
                    participants_response = requests.get(f"{base_url}/api/ai/tournament/{tournament_id}/participants")
                    
                    if participants_response.status_code == 200:
                        participants_data = participants_response.json()
                        if participants_data['success']:
                            participants = participants_data['participants']
                            print(f"✅ Found {len(participants)} participants with AI stats")
                            
                            # Show sample participant
                            if participants:
                                player = participants[0]
                                print(f"🎯 Sample Player: {player['username']}")
                                print(f"   Skill Rating: {player['skill_rating']}/100")
                                print(f"   Win Rate: {player['win_rate']}%")
                            
                            print("\n🎉 AI Bracket Generator is ready!")
                            print("📝 Instructions:")
                            print("1. Double-click 'start_server.bat' to start the server")
                            print("2. Open http://localhost:5000 in your browser")
                            print("3. Navigate to AI Bracket Generator")
                            print("4. Select a tournament and generate AI brackets!")
                            
                        else:
                            print("❌ Error loading participants:", participants_data['error'])
                    else:
                        print("❌ Participants endpoint failed")
                else:
                    print("⚠️ No tournaments found with enough participants")
            else:
                print("❌ Error:", data['error'])
        else:
            print("❌ Server not responding. Please start the Flask server first.")
            print("💡 Run: python app.py")
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to server")
        print("💡 Please start the Flask server first:")
        print("   1. Double-click 'start_server.bat'")
        print("   2. Or run: python app.py")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_ai_endpoints()
