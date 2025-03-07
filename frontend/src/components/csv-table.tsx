import { Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import React from "react";
import Papa from "papaparse";

interface CsvTableProps {
    data: string;
}

interface ParsedData {
    [key: string]: string;
}

const parseCsv = (csvData: string): ParsedData[] => {
    return Papa.parse<ParsedData>(csvData, {
        header: true, // Set to false if your CSV does not have a header row
        skipEmptyLines: true,
    }).data;
};


const CsvTable: React.FC<CsvTableProps> = ({ data}) => {
    const parseData = parseCsv(data);
    const headers = parseData.length ? Object.keys(parseData[0]) : [];
    return (
        <Table>
            <TableHead>
                <TableRow>
                    {headers.map((header, index) => (
                        <TableCell key={index}>{header}</TableCell>
                    ))}
                </TableRow>
            </TableHead>
            <TableBody>
                {parseData.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                        {headers.map((header, cellIndex) => (
                            <TableCell key={cellIndex}>{row[header]}</TableCell>
                        ))}
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

export default CsvTable;