import {BlockListProviderResult} from "../provider/BlockListProvider";

export class SelectedAddressStoreState {
    selectedAddress?: string;
}

class SelectedAddressStore {
    state: SelectedAddressStoreState;
    observers = new Array<any>();

    public attach(observer : any) {
        this.observers.push(observer);
    }
    public detach(observerToRemove: any) {
        this.observers = this.observers.filter(observer => observerToRemove !== observer);
    }

    constructor (initialState : SelectedAddressStoreState) {
        this.state = initialState;
    }

    public setSelectedAddress(address?: string) {
        let newState = new SelectedAddressStoreState();
        newState.selectedAddress = address;
        this.setState(newState);
    }

    public setState(state : SelectedAddressStoreState) {
        this.state = state;
        this.notify();
    }

    public getState() : SelectedAddressStoreState {
        return this.state;
    }

    notify() {
        this.observers.forEach(observer => observer.selectedAddressChanged(this.state));
    }
}

const selectedAddressStore = new SelectedAddressStore(new SelectedAddressStoreState());
export default selectedAddressStore;