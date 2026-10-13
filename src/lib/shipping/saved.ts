import snapshot from '../../../data/shipping-lines.json';
import {carriers} from './carriers';
import {validateShippingSnapshot} from './parse';
import type {ShippingRanking,ShippingSnapshot} from './types';
export function getSavedShippingRanking():ShippingRanking{return {...validateShippingSnapshot(snapshot as ShippingSnapshot),carriers,savedCopy:true};}
