const initialState = {
    markers: [],
    region: {
        latitude: 35.6591246694541,
        longitude: 139.728567802469,
        latitudeDelta: 0.04864195044303443,
        longitudeDelta: 0.040142817690068,
      },
      visible: false,
}

const reducer = (state = initialState, action) => {
    switch (action.type) {
        case "RENDER_PHOTOS": {
            const stateChanges = { markers: action.photos };
        return {
            ...state,
            markers: [...state.markers, action.photos]
            };
        }
        case "CHANGE_CARDVISIBILITY": {
            const stateChanges = { visible: action.visibility };
            return {
                ...state,
                ...stateChanges
            }
        }
        default: {
            return state;
        }
    }
}

export default reducer;