import pytest

from app.main import check_internal_key


@pytest.mark.parametrize("key", ["", "change-me", "change-me-to-a-long-random-string", "short-key"])
def test_weak_internal_keys_are_rejected(key):
    with pytest.raises(RuntimeError):
        check_internal_key(key)


def test_long_random_internal_key_is_accepted():
    check_internal_key("0f4c9a1e7b2d4c6f8a9e1b3d5f7a9c2e")
