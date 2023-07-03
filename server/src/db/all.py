from .models.asset import Asset
from .models.asset_rect import AssetRect
from .models.aura import Aura
from .models.base_rect import BaseRect
from .models.character import Character
from .models.circle import Circle
from .models.circular_token import CircularToken
from .models.composite_shape_association import CompositeShapeAssociation
from .models.constants import Constants
from .models.data_block import DataBlock
from .models.data_block_character import CharacterDataBlock
from .models.floor import Floor
from .models.group import Group
from .models.initiative import Initiative
from .models.label import Label
from .models.label_selection import LabelSelection
from .models.layer import Layer
from .models.line import Line
from .models.location import Location
from .models.location_options import LocationOptions
from .models.location_user_option import LocationUserOption
from .models.marker import Marker
from .models.note import Note
from .models.notification import Notification
from .models.player_room import PlayerRoom
from .models.polygon import Polygon
from .models.rect import Rect
from .models.room import Room
from .models.shape import Shape
from .models.shape_label import ShapeLabel
from .models.shape_owner import ShapeOwner
from .models.shape_type import ShapeType
from .models.text import Text
from .models.toggle_composite import ToggleComposite
from .models.tracker import Tracker
from .models.user import User
from .models.user_options import UserOptions
from .signals import *  # noqa: F403

ALL_MODELS = [
    AssetRect,
    Asset,
    Aura,
    BaseRect,
    Character,
    CharacterDataBlock,
    Circle,
    CircularToken,
    CompositeShapeAssociation,
    Constants,
    DataBlock,
    Floor,
    Group,
    Initiative,
    LabelSelection,
    Label,
    Layer,
    Line,
    LocationOptions,
    LocationUserOption,
    Location,
    Marker,
    Note,
    Notification,
    PlayerRoom,
    Polygon,
    Rect,
    Room,
    ShapeLabel,
    ShapeOwner,
    ShapeType,
    Shape,
    Text,
    ToggleComposite,
    Tracker,
    UserOptions,
    User,
]
