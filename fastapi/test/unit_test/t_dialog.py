from sdk import Questin
from common import HOST_ADDRESS

def test_list_dialog_with_success(get_api_key_fixture):
    API_KEY = get_api_key_fixture
    rag = Questin(API_KEY, HOST_ADDRESS)
    