import React, { useEffect, useState } from "react";
import logo from "../../assets/logo.png";
import {Actor, HttpAgent } from "@dfinity/agent";
import { idlFactory } from "../../../declarations/nft";
import { idlFactory as tokenIdlFactory } from "../../../declarations/token";
import { Principal } from "@dfinity/principal";
import Button from "./Button";
import { opend } from "../../../declarations/opend";
import CURRENT_USER_ID from "../index";
import PriceLabel from "./PriceLabel";


function Item(props) {
  const id = props.id;
  const localHost = "http://localhost:8000";
  const agent = new HttpAgent({ host: localHost });
  // when deployed, remove the code
  agent.fetchRootKey()
  // ==============================
  const [name, setName] = useState("");
  const [principal, setPrincipal] = useState(null)
  const [image, setImage] = useState("");
  const [button, setButton] = useState();
  const [priceInput, setPriceInput] = useState();
  const [loaderHidden, setLoaderHidden] = useState(true);
  const [blur, setBlur] = useState();
  const [sellStatus, setSellStatus] = useState("");
  const [priceLabel, setPriceLabel] = useState();
  const [shouldDisplay, setShouldDisplay] = useState(true);
  let NFTActor;

  async function loadNFT() {
    NFTActor = await Actor.createActor(idlFactory,{
      agent,
      canisterId: id
    });
    const name = await NFTActor.getName();
    setName(name);

    const principal = await NFTActor.getOwner();
    setPrincipal(principal.toText());

    const imageData = await NFTActor.getImage();
    const imageContent = new Uint8Array(imageData);
    const image = URL.createObjectURL(new Blob([imageContent], { type: "image/png" }));
    setImage(image);

    if(props.role == "collection"){
      const nftIsListed = await opend.isListed(props.id);
      if(nftIsListed){
        setPrincipal("OpenD");
        setBlur({filter: "blur(5px)"})
        setSellStatus("Listed");
      }else{
        setButton(<Button handleClick={handleSell} text={"sell"}></Button>);
      }    
    }else if(props.role == "discover"){
      const originalOwner = await opend.getOriginalOwner(props.id);
      if(originalOwner != CURRENT_USER_ID){
        setButton(<Button handleClick={handleBuy} text={"buy"}></Button>);
      };

      const price = await opend.getListedNFTPrice(props.id);
      setPriceLabel(<PriceLabel price={price.toString()}/>);
    }
    
  }

  useEffect(() => {
    loadNFT();
  }, []);

  let price;
  function handleSell(){
    setPriceInput(
      <input
        placeholder="Price in GARD"
        type="number"
        className="price-input"
        value={price}
        onChange={(e) => (price = e.target.value)}
      />
    );
    setButton(<Button handleClick={sellItem} text={"confirm"}></Button>)
  }

  async function sellItem(){
    setBlur({filter: "blur(5px)"})
    setLoaderHidden(false)
    const listingResult = await opend.listItem(id, Number(price));
    console.log("listingResult",listingResult);
    if(listingResult == "Success"){
      const openDId = await opend.getOpenDCanisterID()
      const transferResult = await NFTActor.transferOwnership(openDId);
      console.log("transfe",transferResult);
      if(transferResult == "Success"){
        setLoaderHidden(true);
        setButton();
        setPriceInput();
        setPrincipal("OpenD");
        setSellStatus("Listerd");
      };
    }
  }

  async function handleBuy(){
    console.log("handleBuy");
    setLoaderHidden(false);
    const tokenActor = await Actor.createActor(tokenIdlFactory, {
      agent,
      canisterId: Principal.fromText("tfuft-aqaaa-aaaaa-aaaoq-cai"),
    });

    const sellerId = await opend.getOriginalOwner(props.id);
    const itemPrice = await opend.getListedNFTPrice(props.id);

    console.log("sellerId", sellerId);
    console.log("itemPrice", itemPrice);

    const results = await tokenActor.transfer(sellerId, itemPrice);
    if(results == "Success"){
      const transferResults = await opend.completePurchase(
        props.id,
        sellerId,
        CURRENT_USER_ID
      );
      console.log("purchase", transferResults);
      setLoaderHidden(true);
      setShouldDisplay(false);
    }
  };
    

  return (
    <div style={{display: shouldDisplay ? "inline" : "block"}} className="disGrid-item">
      <div className="disPaper-root disCard-root makeStyles-root-17 disPaper-elevation1 disPaper-rounded">
        <img
          className="disCardMedia-root makeStyles-image-19 disCardMedia-media disCardMedia-img"
          src={image}
          style={blur}
        />
        <div hidden={loaderHidden} className="lds-ellipsis">
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
        <div className="disCardContent-root">
          {priceLabel}
          <h2 className="disTypography-root makeStyles-bodyText-24 disTypography-h5 disTypography-gutterBottom">
            {name}<span className="purple-text"> {sellStatus}</span>
          </h2>
          <p className="disTypography-root makeStyles-bodyText-24 disTypography-body2 disTypography-colorTextSecondary">
            <p className="disTypography-root makeStyles-bodyText-24 disTypography-body2 disTypography-colorTextSecondary">
              Owner: {principal}
            </p>
            {priceInput}
            {button}
          </p>
        </div>
      </div>
    </div>
  );
}

export default Item;
