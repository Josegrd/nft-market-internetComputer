import Text "mo:base/Text";
import Principal "mo:base/Principal";
import NFTActorClass "../NFT/nft";
import Cycles "mo:base/ExperimentalCycles";
import Debug "mo:base/Debug";
import HashMap "mo:base/HashMap";
import List "mo:base/List";

actor OpenD {
    
    var mapOfNFT = HashMap.HashMap<Principal, NFTActorClass.NFT>(1, Principal.equal, Principal.hash);
    var mapOfOwner = HashMap.HashMap<Principal,List.List<Principal>>(1, Principal.equal, Principal.hash);

    public shared(msg) func mint(imgData: [Nat8], name: Text) : async Principal{
        let owner : Principal = msg.caller;

        Debug.print(debug_show(Cycles.balance()));
        Cycles.add(100_500_000_000);
        let newNFT = await NFTActorClass.NFT(name, owner, imgData);
        Debug.print(debug_show(Cycles.balance()));

        let newNFTPrincipal = await newNFT.getCanisterId();

        mapOfNFT.put(newNFTPrincipal, newNFT);
        addToOwnershipMap(owner, newNFTPrincipal);

        return newNFTPrincipal;
    };

    private func addToOwnershipMap(owner: Principal, nftId:Principal){
        var ownedNFTs: List.List<Principal> = switch(mapOfOwner.get(owner)){
            case null List.nil<Principal>();
            case (?result) result;
        };

        ownedNFTs := List.push(nftId, ownedNFTs);
        mapOfOwner.put(owner, ownedNFTs);
    };

    public query func getOwnedNFTs(owner: Principal) : async [Principal]{
        var userNFTs : List.List<Principal> = switch(mapOfOwner.get(owner)){
            case null List.nil<Principal>();
            case (?result) result;
        };

        return List.toArray(userNFTs);
    }

};
